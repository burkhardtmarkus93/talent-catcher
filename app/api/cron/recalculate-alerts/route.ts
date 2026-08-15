import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { recalculateAlertForTalent } from "@/lib/alerts/riskEngine";

// Bisher wurde die Risikobewertung nur beim Speichern eines neuen
// Sichtungsberichts neu berechnet (lib/actions/reports.ts) — ein Talent,
// das länger nicht gesichtet wird, obwohl z. B. der Vertrag ausläuft oder
// eine Wiedervorlage überfällig wird, bekam dadurch nie ein aktuelles
// Alert-Update. Dieser Cron-Job läuft täglich über alle aktiven Talente
// und schließt genau diese Lücke — das "Früh" im Frühwarnsystem.
//
// Läuft mit dem Admin-Client (service role), weil ein Cron-Aufruf keine
// Nutzer-Session hat und vereinsübergreifend über alle Talente laufen
// muss. Vercel schickt bei konfigurierten Cron Jobs automatisch einen
// "Authorization: Bearer $CRON_SECRET"-Header mit — CRON_SECRET muss
// dafür einmalig als Vercel-Projekt-Env-Var gesetzt werden.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: talents, error } = await supabase
    .from("talents")
    .select("id")
    .is("archived_at", null)
    .neq("status", "verloren");

  if (error) {
    console.error(
      "Cron recalculate-alerts: Talente konnten nicht geladen werden",
      error.message
    );
    return NextResponse.json(
      { error: "Talente konnten nicht geladen werden." },
      { status: 500 }
    );
  }

  let recalculated = 0;
  for (const talent of talents ?? []) {
    await recalculateAlertForTalent(supabase, talent.id);
    recalculated += 1;
  }

  return NextResponse.json({ recalculated });
}
