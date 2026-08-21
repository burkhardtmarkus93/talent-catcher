import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Bisher war talents.deletion_scheduled_at nur ein Datumsfeld ohne jede
// Wirkung — ein Scout konnte ein Lösch-/Archivierungsdatum setzen, aber
// nichts geschah danach automatisch. Dieser Cron-Job archiviert
// (archived_at wird gesetzt, keine echte Löschung — bewusst mit dem
// Projektverantwortlichen abgestimmt, siehe Audit-Nachbesprechung) alle
// Talente, deren Stichtag erreicht oder überschritten ist und die noch
// nicht archiviert sind. Läuft täglich, gleiches Auth-/Admin-Client-
// Muster wie recalculate-alerts.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: archived, error } = await supabase
    .from("talents")
    .update({ archived_at: new Date().toISOString() })
    .lte("deletion_scheduled_at", today)
    .is("archived_at", null)
    .select("id");

  if (error) {
    console.error(
      "Cron archive-scheduled-talents: Archivierung fehlgeschlagen",
      error.message
    );
    return NextResponse.json(
      { error: "Archivierung fehlgeschlagen." },
      { status: 500 }
    );
  }

  return NextResponse.json({ archived: archived?.length ?? 0 });
}
