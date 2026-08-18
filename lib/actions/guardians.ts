"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";

// Nur Nutzer mit Jugendschutz-Zugriff dürfen einen Eltern-Zugang für ein
// Talent freischalten — dieselbe Berechtigung wie für das Erteilen einer
// Video-Einwilligung (lib/actions/consent.ts), da eine Eltern-Einladung
// genauso sensibel ist: sie eröffnet einer bislang plattformfremden
// Person direkten Zugriff auf Daten (potenziell) eines minderjährigen
// Talents.
export async function inviteGuardian(formData: FormData): Promise<void> {
  const talentId = String(formData.get("talentId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!talentId) {
    throw new Error("Talent-ID fehlt.");
  }
  if (!email) {
    throw new Error("Bitte E-Mail-Adresse angeben.");
  }

  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId || !appUser.hasYouthAccess) {
    throw new Error(
      "Dafür ist die Berechtigung „Zugriff auf Jugendtalente“ erforderlich."
    );
  }

  const supabase = await createClient();

  const { data: talent, error: talentError } = await supabase
    .from("talents")
    .select("id, club_id")
    .eq("id", talentId)
    .maybeSingle();

  if (talentError || !talent || talent.club_id !== appUser.clubId) {
    throw new Error("Talent nicht gefunden.");
  }

  const admin = createAdminClient();

  // Existiert die E-Mail bereits als Nutzer:innen-Konto? Dann nicht per
  // inviteUserByEmail neu einladen (schlägt für bereits registrierte
  // Adressen fehl), sondern je nach bestehender Rolle entweder direkt
  // verknüpfen (falls schon ein Eltern-Konto, z. B. für ein Geschwister)
  // oder ablehnen (ein bestehendes Scout-/Admin-Konto soll nicht
  // stillschweigend zusätzlich Eltern-Rechte bekommen). Admin-Client
  // nötig: ein Eltern-Konto hat keinen club_id, die normale
  // users_select_club_admin-Policy (vereins-gescopt) könnte es über die
  // Scout-/Admin-Session ohnehin nie finden.
  const { data: existingUser } = await admin
    .from("users")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();

  const { data: guardianRow, error: insertError } = await supabase
    .from("talent_guardians")
    .insert({
      talent_id: talentId,
      email,
      invited_by: appUser.id,
    })
    .select("id")
    .single();

  if (insertError || !guardianRow) {
    console.error("inviteGuardian() fehlgeschlagen (Insert):", {
      message: insertError?.message,
      code: insertError?.code,
      details: insertError?.details,
      hint: insertError?.hint,
    });
    if (insertError?.code === "23505") {
      throw new Error("Diese E-Mail-Adresse ist für dieses Talent bereits eingeladen.");
    }
    throw new Error("Einladung konnte nicht angelegt werden.");
  }

  if (existingUser) {
    if (existingUser.role !== "parent") {
      throw new Error(
        "Diese E-Mail-Adresse ist bereits als Scout/Admin registriert und kann nicht zusätzlich als Eltern-Zugang verknüpft werden."
      );
    }

    // Admin-Client, weil dafür keine eigene UPDATE-RLS-Policy auf
    // talent_guardians existiert (Lese-/Insert-Policies reichen für den
    // Normalfall; dieses direkte Verknüpfen ist ein bewusst seltener
    // Sonderfall für bereits bestehende Eltern-Konten).
    const { error: linkError } = await admin
      .from("talent_guardians")
      .update({ user_id: existingUser.id, claimed_at: new Date().toISOString() })
      .eq("id", guardianRow.id);

    if (linkError) {
      console.error("inviteGuardian() fehlgeschlagen (direkte Verknüpfung):", linkError.message);
      throw new Error("Verknüpfung mit bestehendem Eltern-Konto fehlgeschlagen.");
    }

    revalidatePath(`/talents/${talentId}`);
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm`,
    data: { pending_role: "parent" },
  });

  if (inviteError) {
    console.error("inviteGuardian() fehlgeschlagen (E-Mail-Einladung):", inviteError.message);
    throw new Error("Einladungs-E-Mail konnte nicht verschickt werden.");
  }

  revalidatePath(`/talents/${talentId}`);
}

async function requireGuardianTalent(talentId: string) {
  const appUser = await getCurrentAppUser();
  if (!appUser || appUser.role !== "parent") {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: link } = await supabase
    .from("talent_guardians")
    .select("id")
    .eq("talent_id", talentId)
    .eq("user_id", appUser.id)
    .not("claimed_at", "is", null)
    .maybeSingle();

  if (!link) {
    redirect("/parent?error=" + encodeURIComponent("Kein Zugriff auf dieses Talent."));
  }

  return appUser;
}

// Eltern dürfen ausschließlich Verein/Team aktualisieren — serverseitig
// zusätzlich per Datenbank-Trigger erzwungen (guard_guardian_talent_update,
// Migration 20260816010000), diese Action ist die "gutartige" Seite davon.
export async function updateGuardianTalentClub(formData: FormData): Promise<void> {
  const talentId = String(formData.get("talentId") ?? "");
  const clubNameText = String(formData.get("clubNameText") ?? "").trim();
  const teamNameText = String(formData.get("teamNameText") ?? "").trim() || null;

  if (!talentId) {
    redirect("/parent?error=" + encodeURIComponent("Talent-ID fehlt."));
  }
  if (!clubNameText) {
    redirect(
      `/parent/talents/${talentId}?error=` +
        encodeURIComponent("Vereinsname ist ein Pflichtfeld.")
    );
  }

  await requireGuardianTalent(talentId);

  const supabase = await createClient();
  const { error } = await supabase
    .from("talents")
    .update({ club_name_text: clubNameText, team_name_text: teamNameText })
    .eq("id", talentId);

  if (error) {
    console.error("updateGuardianTalentClub() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    redirect(
      `/parent/talents/${talentId}?error=` +
        encodeURIComponent("Verein konnte nicht aktualisiert werden.")
    );
  }

  revalidatePath(`/parent/talents/${talentId}`);
  redirect(
    `/parent/talents/${talentId}?success=` +
      encodeURIComponent("Verein aktualisiert.")
  );
}
