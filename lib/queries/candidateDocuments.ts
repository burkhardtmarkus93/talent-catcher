import { createClient } from "@/lib/supabase/server";

// Sportliche Vita einer Kandidatur — nutzt die bereits bestehende,
// bisher ungenutzte public.documents-Tabelle (siehe Migrationskommentar
// 20260822190000), gegen candidate_id statt talent_id.
export interface CandidateDocument {
  id: string;
  candidateId: string;
  downloadUrl: string | null;
  fileType: string;
  description: string | null;
  createdAt: string;
}

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function getDocumentsForCandidate(
  candidateId: string
): Promise<CandidateDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, candidate_id, storage_key, file_type, description, created_at")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getDocumentsForCandidate() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Dokumente konnten nicht geladen werden.");
  }

  return Promise.all(
    (data ?? []).map(async (row: any) => {
      const { data: signed } = await supabase.storage
        .from("documents")
        .createSignedUrl(row.storage_key, SIGNED_URL_TTL_SECONDS);

      return {
        id: row.id,
        candidateId: row.candidate_id,
        downloadUrl: signed?.signedUrl ?? null,
        fileType: row.file_type,
        description: row.description,
        createdAt: row.created_at,
      };
    })
  );
}

// Für die Kandidaten-Übersicht im Verein: Dokumente mehrerer Kandidaturen
// auf einmal statt N+1 Einzelabfragen — nur die Existenz/Metadaten, ohne
// signierte URL (die wird erst auf der Detailseite/On-Demand erzeugt).
export async function getDocumentCandidateIds(
  candidateIds: string[]
): Promise<Set<string>> {
  if (candidateIds.length === 0) return new Set();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("candidate_id")
    .in("candidate_id", candidateIds);

  if (error) {
    console.error("getDocumentCandidateIds() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return new Set();
  }

  return new Set((data ?? []).map((row: any) => row.candidate_id as string));
}
