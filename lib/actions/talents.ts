"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";
import { getActiveTalentCount } from "@/lib/queries/talents";
import { PLANS, planNameDe } from "@/lib/plans";

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
  const t = await getTranslations("talentActions");
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
      error: t("requiredFields"),
    };
  }

  const birthDateObj = new Date(birthDate);
  if (Number.isNaN(birthDateObj.getTime()) || birthDateObj.getTime() > Date.now()) {
    return {
      success: false,
      error: t("invalidBirthDate"),
    };
  }

  const isMinor = calculateAge(birthDate) < 18;

  const appUser = await getCurrentAppUser();

  if (!appUser) {
    return {
      success: false,
      error: t("profileNotFound"),
    };
  }

  if (!appUser.clubId) {
    return {
      success: false,
      error: t("noClubAssigned"),
    };
  }

  if (isMinor && !appUser.hasYouthAccess) {
    return {
      success: false,
      error: t("youthAccessRequired"),
    };
  }

  const planLimit = appUser.clubPlan ? PLANS[appUser.clubPlan]?.maxActiveTalents : null;
  if (planLimit !== null && planLimit !== undefined) {
    const activeCount = await getActiveTalentCount(appUser.clubId);
    if (activeCount >= planLimit) {
      return {
        success: false,
        error: t("planLimitReached", {
          plan: planNameDe(appUser.clubPlan!),
          limit: planLimit,
        }),
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
        ? t("createFailedDetailed", { detail: insertError.message })
        : t("createFailed"),
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
  const t = await getTranslations("talentActions");
  const talentId = String(formData.get("talentId") ?? "");

  if (!talentId) {
    throw new Error(t("talentIdMissing"));
  }

  const appUser = await getCurrentAppUser();

  if (!appUser) {
    throw new Error(t("profileNotFound"));
  }

  if (!appUser.clubId) {
    throw new Error(t("noClubAssignedShort"));
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
    throw new Error(t("talentLoadFailed"));
  }

  if (!talent) {
    throw new Error(t("talentNotFound"));
  }

  if (talent.club_id !== appUser.clubId) {
    throw new Error(t("notAllowedToArchive"));
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
    throw new Error(t("archiveFailed"));
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
    throw new Error(t("archiveVerifyFailed"));
  }

  if (!verify || !verify.archived_at) {
    throw new Error(t("archiveNotApplied"));
  }

  revalidatePath("/talents");
  revalidatePath(`/talents/${talentId}`);
  redirect("/talents");
}

export async function restoreTalent(formData: FormData): Promise<void> {
  const t = await getTranslations("talentActions");
  const talentId = String(formData.get("talentId") ?? "");

  if (!talentId) {
    throw new Error(t("talentIdMissing"));
  }

  const appUser = await getCurrentAppUser();

  if (!appUser) {
    throw new Error(t("profileNotFound"));
  }

  if (!appUser.clubId) {
    throw new Error(t("noClubAssignedShort"));
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
    throw new Error(t("talentLoadFailed"));
  }

  if (!talent) {
    throw new Error(t("talentNotFound"));
  }

  if (talent.club_id !== appUser.clubId) {
    throw new Error(t("notAllowedToRestore"));
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
    throw new Error(t("restoreFailed"));
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
    throw new Error(t("restoreVerifyFailed"));
  }

  if (!verify || verify.archived_at) {
    throw new Error(t("restoreNotApplied"));
  }

  revalidatePath("/talents");
  revalidatePath(`/talents/${talentId}`);
  redirect(`/talents/${talentId}`);
}

export async function updateExternalProfiles(formData: FormData): Promise<void> {
  const t = await getTranslations("talentActions");
  const talentId = String(formData.get("talentId") ?? "");
  const transfermarktUrl = String(formData.get("transfermarktUrl") ?? "").trim();
  const fupaUrl = String(formData.get("fupaUrl") ?? "").trim();

  if (!talentId) {
    throw new Error(t("talentIdMissing"));
  }

  for (const url of [transfermarktUrl, fupaUrl]) {
    if (url && !/^https?:\/\//i.test(url)) {
      throw new Error(t("invalidUrl"));
    }
  }

  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId) {
    throw new Error(t("notAuthenticated"));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("talents")
    .update({
      transfermarkt_url: transfermarktUrl || null,
      fupa_url: fupaUrl || null,
    })
    .eq("id", talentId)
    .eq("club_id", appUser.clubId);

  if (error) {
    console.error("updateExternalProfiles() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(t("externalProfilesSaveFailed"));
  }

  revalidatePath(`/talents/${talentId}`);
}

export async function updateTalentOverview(formData: FormData): Promise<void> {
  const t = await getTranslations("talentActions");
  const talentId = String(formData.get("talentId") ?? "");
  if (!talentId) {
    throw new Error(t("talentIdMissing"));
  }

  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId) {
    throw new Error(t("notAuthenticated"));
  }

  const status = String(formData.get("status") ?? "in_beobachtung");
  const contractStatus = String(formData.get("contractStatus") ?? "unbekannt");
  const contractEndDate =
    String(formData.get("contractEndDate") ?? "").trim() || null;
  const leagueText = String(formData.get("leagueText") ?? "").trim() || null;
  const countryText = String(formData.get("countryText") ?? "").trim() || null;
  const visibilityStatus = String(formData.get("visibilityStatus") ?? "privat");

  const update: Record<string, unknown> = {
    status,
    contract_status: contractStatus,
    contract_end_date: contractEndDate,
    league_text: leagueText,
    country_text: countryText,
    visibility_status: visibilityStatus,
    dfb_stuetzpunkt: formData.get("dfbStuetzpunkt") === "on",
    verbandsauswahl: formData.get("verbandsauswahl") === "on",
    nationalmannschaft: formData.get("nationalmannschaft") === "on",
    nlz: formData.get("nlz") === "on",
  };

  // Größe/Gewicht nur übernehmen, wenn das Formular sie überhaupt enthält
  // — die Felder werden nur gezeigt, wenn der bearbeitende Nutzer
  // Jugendschutz-Zugriff hat (oder das Talent volljährig ist). So wird
  // ein bestehender Wert nicht durch das Fehlen des Feldes gelöscht, nur
  // weil der aktuelle Nutzer es gerade nicht sehen darf.
  if (formData.has("heightCm")) {
    const heightCmRaw = String(formData.get("heightCm") ?? "").trim();
    update.height_cm = heightCmRaw ? Number(heightCmRaw) : null;
  }
  if (formData.has("weightKg")) {
    const weightKgRaw = String(formData.get("weightKg") ?? "").trim();
    update.weight_kg = weightKgRaw ? Number(weightKgRaw) : null;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("talents")
    .update(update)
    .eq("id", talentId)
    .eq("club_id", appUser.clubId);

  if (error) {
    console.error("updateTalentOverview() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(t("updateFailed"));
  }

  revalidatePath(`/talents/${talentId}`);
  revalidatePath("/talents");
}

export async function updateTalentClub(formData: FormData): Promise<void> {
  const t = await getTranslations("talentActions");
  const talentId = String(formData.get("talentId") ?? "");
  if (!talentId) {
    throw new Error(t("talentIdMissing"));
  }

  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId) {
    throw new Error(t("notAuthenticated"));
  }

  const clubNameText = String(formData.get("clubNameText") ?? "").trim();
  const teamNameText = String(formData.get("teamNameText") ?? "").trim() || null;
  const upcomingTransferClubText =
    String(formData.get("upcomingTransferClubText") ?? "").trim() || null;
  const upcomingTransferNote =
    String(formData.get("upcomingTransferNote") ?? "").trim() || null;

  if (!clubNameText) {
    throw new Error(t("clubNameRequired"));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("talents")
    .update({
      club_name_text: clubNameText,
      team_name_text: teamNameText,
      upcoming_transfer_club_text: upcomingTransferClubText,
      upcoming_transfer_note: upcomingTransferNote,
    })
    .eq("id", talentId)
    .eq("club_id", appUser.clubId);

  if (error) {
    console.error("updateTalentClub() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(t("clubUpdateFailed"));
  }

  revalidatePath(`/talents/${talentId}`);
  revalidatePath("/talents");
}
