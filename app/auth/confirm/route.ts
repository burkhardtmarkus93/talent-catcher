import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/update-password`);
    }
  }

  return NextResponse.redirect(
    `${origin}/reset-password?error=Link%20ung%C3%BCltig%20oder%20abgelaufen.%20Bitte%20neu%20anfordern.`
  );
}
