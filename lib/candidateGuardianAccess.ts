import { createClient, createAdminClient } from "@/lib/supabase/server";

// Lädt eine/n Erziehungsberechtigte/n zu einem eigenen Portal-Zugang
// (Rolle 'parent') ein — für den späteren automatischen Eltern-Zugang,
// falls der Verein die Kandidatur annimmt (siehe
// lib/actions/candidates.ts::acceptTalentCandidate). Aufgerufen aus
// app/api/stripe/webhook/route.ts NACH bestätigter Zahlung, nicht schon
// bei der Formular-Übermittlung — die Zahlung selbst ist jetzt der
// Vertrauensanker, ein zusätzlicher E-Mail-Bestätigungsschritt für die
// Sichtbarkeit ist dafür nicht mehr nötig (siehe Migration
// 20260821120000).
export async function inviteCandidateGuardian(email: string): Promise<void> {
  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const { data: existingUser } = await admin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingUser) {
    // Bereits ein bestehendes Konto (z. B. schon Eltern-Zugang für ein
    // Geschwisterkind) — inviteUserByEmail schlägt für registrierte
    // Adressen fehl, daher stattdessen ein Passwort-Reset-Link
    // (öffentlich auslösbar, identisch zur bestehenden
    // /reset-password-Seite). Das erneute Durchlaufen von
    // app/auth/confirm/route.ts beweist genauso den E-Mail-Zugriff und
    // löst darüber confirm_candidate_guardian_consent() aus.
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/confirm`,
    });
    return;
  }

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm`,
    data: { pending_role: "candidate_guardian" },
  });

  if (error) {
    console.error("inviteCandidateGuardian() fehlgeschlagen:", error.message);
  }
}
