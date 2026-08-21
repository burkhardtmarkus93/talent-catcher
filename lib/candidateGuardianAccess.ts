import { createClient, createAdminClient } from "@/lib/supabase/server";

// Lädt eine Person zu einem eigenen Portal-Zugang ein — entweder als
// Erziehungsberechtigte/r ('candidate_guardian', Rolle 'parent' laut
// handle_new_auth_user()) für den automatischen Eltern-Zugang bei
// Annahme einer Kandidatur bzw. bei Kauf von Bearbeitungs-Zugang zu
// einem bereits bestehenden minderjährigen Talent (siehe
// lib/actions/candidates.ts::acceptTalentCandidate und
// lib/actions/talentEditAccess.ts), oder als eigener
// Selbstverwaltungs-Zugang für volljährige Spieler ('player'). Aufgerufen
// NACH bestätigter Zahlung (Stripe-Webhook), nicht schon bei der
// Formular-Übermittlung — die Zahlung selbst ist der Vertrauensanker,
// ein zusätzlicher E-Mail-Bestätigungsschritt für die
// Sichtbarkeit/den Zugriff ist dafür nicht mehr nötig (siehe Migration
// 20260821120000/20260821140000).
export async function invitePortalAccess(
  email: string,
  pendingRole: "candidate_guardian" | "player"
): Promise<void> {
  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const { data: existingUser } = await admin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingUser) {
    // Bereits ein bestehendes Konto (z. B. schon Eltern-/Spieler-Zugang
    // für ein Geschwisterkind bzw. ein weiteres eigenes Profil) —
    // inviteUserByEmail schlägt für registrierte Adressen fehl, daher
    // stattdessen ein Passwort-Reset-Link (öffentlich auslösbar,
    // identisch zur bestehenden /reset-password-Seite). Das erneute
    // Durchlaufen von app/auth/confirm/route.ts beweist genauso den
    // E-Mail-Zugriff und löst darüber confirm_deferred_access_links() aus.
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/confirm`,
    });
    return;
  }

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm`,
    data: { pending_role: pendingRole },
  });

  if (error) {
    console.error("invitePortalAccess() fehlgeschlagen:", error.message);
  }
}
