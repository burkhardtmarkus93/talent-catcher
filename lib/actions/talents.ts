"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";
import { getActiveTalentCount } from "@/lib/queries/talents";
import { PLANS } from "@/lib/plans";

export interface TalentActionState {
  success: boolean;
  error?: string;
}

function calculateAge(birthDate: string): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export async function createTalent(
  _prevState: TalentActionState,
  formData: FormData
): Promise<TalentActionState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const birthDate = String(formData.get("birthDate") ?? "");
  const primaryPosition = String(formData.get("primaryPosition") ?? "").trim();
  const secondaryPosition =
    String(formData.get("secondaryPosition") ?? "").trim() || null;
  const clubNameText = String(formData.get("clubNameText") ?? "").trim() || null;
  const teamNameText = String(formData.get("teamNameText") ?? "").trim() || null;
  const leagueText = String(formData.get("leagueText") ?? "").trim() || null;
  const countryText = String(formData.get("countryText") ?? "").trim() || null;
  const contractStatus = String(formData.get("contractStatus") ?? "unbekannt");
  const contractEndDate =
    String(formData.get("contractEndDate") ?? "").trim() || null;

  const heightCmRaw = String(formData.get("heightCm") ?? "").trim();
  const weightKgRaw = String(formData.get("weightKg") ?? "").trim();
  const heightCm = heightCmRaw ? Number(heightCmRaw) : null;
  const weightKg = weightKgRaw ? Number(weightKgRaw) : null;

  if (!firstName || !lastName || !birthDate || !primaryPosition) {
    return {
      success: false,
      error:
        "Vorname, Nachname, Geburtsdatum und Hauptposition sind Pflichtfelder.",
    };
  }

  const birthDateObj = new Date(birthDate);
  if (Number.isNaN(birthDateObj.getTime()) || birthDateObj.getTime() > Date.now()) {
    return {
      success: false,
      error: "Das Geburtsdatum ist ungültig oder liegt in der Zukunft.",
    };
  }

  const isMinor = calculateAge(birthDate) < 18;

  const appUser = await getCurrentAppUser();

  if (!appUser) {
    return {
      success: false,
      error: "Benutzerprofil nicht gefunden. Bitte erneut anmelden.",
    };
  }

  if (!appUser.clubId) {
    return {
      success: false,
      error:
        "Deinem Benutzer ist kein Verein zugeordnet. Talentanlage ist erst nach Vereinszuordnung möglich.",
    };
  }

  if (isMinor && !appUser.hasYouthAccess) {
    return {
      success: false,
      error:
        "Für die Anlage minderjähriger Talente ist die Berechtigung „Zugriff auf Jugendtalente“ erforderlich.",
    };
  }

  const planLimit = appUser.clubPlan ? PLANS[appUser.clubPlan]?.maxActiveTalents : null;
  if (planLimit !== null && planLimit !== undefined) {
    const activeCount = await getActiveTalentCount(appUser.clubId);
    if (activeCount >= planLimit) {
      return {
        success: false,
        error: `Dein Plan „${PLANS[appUser.clubPlan!].name}“ ist auf ${planLimit} aktive Talente begrenzt. Bitte upgraden oder ein Talent archivieren.`,
      };
    }
  }

  const supabase = await createClient();

  const { data: inserted, error: insertError } = await supabase
    .from("talents")
    .insert({
      club_id: appUser.clubId,
      created_by: appUser.id,
      first_name: firstName,
      last_name: lastName,
      birth_date: birthDate,
      primary_position: primaryPosition,
      secondary_position: secondaryPosition,
      club_name_text: clubNameText,
      team_name_text: teamNameText,
      league_text: leagueText,
      country_text: countryText,
      contract_status: contractStatus,
      contract_end_date: contractEndDate,
      height_cm: heightCm,
      weight_kg: weightKg,
    })
    .select("id, is_minor")
    .single();

  if (insertError || !inserted) {
    console.error("createTalent() vollständiger Fehler:", {
      message: insertError?.message,
      code: insertError?.code,
      details: insertError?.details,
      hint: insertError?.hint,
    });

    return {
      success: false,
      error: insertError?.message
        ? `Talent konnte nicht gespeichert werden. ${insertError.message}`
        : "Talent konnte nicht gespeichert werden.",
    };
  }

  if (inserted.is_minor) {
    const { error: consentError } = await supabase.from("consent_records").insert({
      talent_id: inserted.id,
      scope: "profil_sichtbarkeit",
      status: "angefragt",
      requested_at: new Date().toISOString(),
      recorded_by: appUser.id,
    });

    if (consentError) {
      console.error("createTalent(): Consent-Platzhalter fehlgeschlagen:", {
        message: consentError.message,
        code: consentError.code,
        details: consentError.details,
        hint: consentError.hint,
      });
    }
  }

  revalidatePath("/talents");
  redirect(`/talents/${inserted.id}`);
}

export async function archiveTalent(formData: FormData): Promise<void> {
  const talentId = String(formData.get("talentId") ?? "");

  if (!talentId) {
    throw new Error("Talent-ID fehlt.");
  }

  const appUser = await getCurrentAppUser();

  if (!appUser) {
    throw new Error("Benutzerprofil nicht gefunden. Bitte erneut anmelden.");
  }

  if (!appUser.clubId) {
    throw new Error("Deinem Benutzer ist kein Verein zugeordnet.");
  }

  const supabase = await createClient();

  const { data: talent, error: talentError } = await supabase
    .from("talents")
    .select("id, club_id")
    .eq("id", talentId)
    .maybeSingle();

  if (talentError) {
    console.error("archiveTalent(): Talent-Lookup fehlgeschlagen:", {
      message: talentError.message,
      code: talentError.code,
      details: talentError.details,
      hint: talentError.hint,
    });
    throw new Error("Talent konnte nicht geladen werden.");
  }

  if (!talent) {
    throw new Error("Talent nicht gefunden.");
  }

  if (talent.club_id !== appUser.clubId) {
    throw new Error("Du darfst dieses Talent nicht archivieren.");
  }

  const archivedAt = new Date().toISOString();

  const { error } = await supabase
    .from("talents")
    .update({
      archived_at: archivedAt,
    })
    .eq("id", talentId);

  if (error) {
    console.error("archiveTalent() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Talent konnte nicht archiviert werden.");
  }

  const { data: verify, error: verifyError } = await supabase
    .from("talents")
    .select("id, archived_at")
    .eq("id", talentId)
    .maybeSingle();

  if (verifyError) {
    console.error("archiveTalent(): Verifikation fehlgeschlagen:", {
      message: verifyError.message,
      code: verifyError.code,
      details: verifyError.details,
      hint: verifyError.hint,
    });
    throw new Error("Archivierung konnte nicht verifiziert werden.");
  }

  if (!verify || !verify.archived_at) {
    throw new Error("Talent wurde nicht archiviert.");
  }

  revalidatePath("/talents");
  revalidatePath(`/talents/${talentId}`);
  redirect("/talents");
}

export async function restoreTalent(formData: FormData): Promise<void> {
  const talentId = String(formData.get("talentId") ?? "");

  if (!talentId) {
    throw new Error("Talent-ID fehlt.");
  }

  const appUser = await getCurrentAppUser();

  if (!appUser) {
    throw new Error("Benutzerprofil nicht gefunden. Bitte erneut anmelden.");
  }

  if (!appUser.clubId) {
    throw new Error("Deinem Benutzer ist kein Verein zugeordnet.");
  }

  const supabase = await createClient();

  const { data: talent, error: talentError } = await supabase
    .from("talents")
    .select("id, club_id")
    .eq("id", talentId)
    .maybeSingle();

  if (talentError) {
    console.error("restoreTalent(): Talent-Lookup fehlgeschlagen:", {
      message: talentError.message,
      code: talentError.code,
      details: talentError.details,
      hint: talentError.hint,
    });
    throw new Error("Talent konnte nicht geladen werden.");
  }

  if (!talent) {
    throw new Error("Talent nicht gefunden.");
  }

  if (talent.club_id !== appUser.clubId) {
    throw new Error("Du darfst dieses Talent nicht wiederherstellen.");
  }

  const { error } = await supabase
    .from("talents")
    .update({
      archived_at: null,
    })
    .eq("id", talentId);

  if (error) {
    console.error("restoreTalent() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Talent konnte nicht wiederhergestellt werden.");
  }

  const { data: verify, error: verifyError } = await supabase
    .from("talents")
    .select("id, archived_at")
    .eq("id", talentId)
    .maybeSingle();

  if (verifyError) {
    console.error("restoreTalent(): Verifikation fehlgeschlagen:", {
      message: verifyError.message,
      code: verifyError.code,
      details: verifyError.details,
      hint: verifyError.hint,
    });
    throw new Error("Wiederherstellung konnte nicht verifiziert werden.");
  }

  if (!verify || verify.archived_at) {
    throw new Error("Talent wurde nicht wiederhergestellt.");
  }

  revalidatePath("/talents");
  revalidatePath(`/talents/${talentId}`);
  redirect(`/talents/${talentId}`);
}
