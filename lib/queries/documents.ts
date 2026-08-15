import { createAdminClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

// Das Koordinationstest-Dokument liegt nicht unter einem club_id-Ordner
// (anders als club-eigene Dokumente/Videos) — es ist eine gemeinsame
// Referenzdatei für alle Vereine, kein personenbezogenes Material. Die
// vereins-gescopte storage_documents_select_same_club-Policy
// (20260722213000_rls_extended.sql) greift hier also nicht, ein normaler
// RLS-gebundener Client könnte für diesen Pfad also keine signierte URL
// erzeugen. Deshalb bewusst der Admin-Client (service role, umgeht RLS)
// — sicher, weil diese Funktion nur eine feste, nicht-personenbezogene
// Datei signiert und nur von bereits eingeloggten Nutzern aus dem
// geschützten Dashboard-Bereich heraus aufgerufen wird. Ersetzt den
// vorherigen hartcodierten, jahrzehntelang gültigen Token im
// ausgelieferten Code durch eine frisch signierte URL mit kurzer
// Gültigkeit.
export async function getKoordinationstestDocUrl(): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(
      "koordinationstest_tests_mit_skizzen.docx",
      SIGNED_URL_TTL_SECONDS
    );

  if (error) {
    console.error("getKoordinationstestDocUrl() fehlgeschlagen:", {
      message: error.message,
    });
    return null;
  }

  return data?.signedUrl ?? null;
}
