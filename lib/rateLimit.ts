import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Bewusst grobe IP-Ermittlung über den ersten Eintrag in X-Forwarded-For
// (von Vercel gesetzt) — für Anti-Spam/Kostenschutz auf öffentlichen
// Formularen ausreichend, kein sicherheitskritischer Anwendungsfall.
function getClientIp(): string {
  const forwardedFor = headers().get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

// Prüft und zählt einen Versuch für scope+IP in einem festen Zeitfenster
// (siehe check_rate_limit(), Migration 20260821170000). Gibt true zurück,
// wenn der Versuch noch erlaubt ist.
export async function checkRateLimit(
  scope: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<boolean> {
  const key = `${scope}:${getClientIp()}`;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("checkRateLimit() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    // Im Zweifel nicht blockieren — ein Ausfall des Rate-Limitings darf
    // öffentliche Formulare nicht komplett lahmlegen.
    return true;
  }

  return data === true;
}
