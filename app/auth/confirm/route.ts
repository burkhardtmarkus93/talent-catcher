import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // No-op außer für eine gerade bestätigte Erziehungsberechtigten-
      // Einladung einer Spieler-Selbstregistrierung (siehe
      // confirm_candidate_guardian_consent(), Migration 20260821100000)
      // — deshalb hier unbedingt erst NACH erfolgreicher Verifizierung
      // aufgerufen, nie beim bloßen Versenden der Einladung.
      await supabase.rpc("confirm_candidate_guardian_consent");
      return NextResponse.redirect(`${origin}/update-password`);
    }
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as
        | "signup"
        | "invite"
        | "magiclink"
        | "recovery"
        | "email_change"
        | "email",
    });

    if (!error) {
      await supabase.rpc("confirm_candidate_guardian_consent");
      if (type === "signup") {
        return NextResponse.redirect(
          `${origin}/login?success=E-Mail%20best%C3%A4tigt.%20Bitte%20melde%20dich%20an.`
        );
      }
      return NextResponse.redirect(`${origin}/update-password`);
    }
  }

  return NextResponse.redirect(
    `${origin}/reset-password?error=Link%20ung%C3%BCltig%20oder%20abgelaufen.%20Bitte%20neu%20anfordern.`
  );
}
