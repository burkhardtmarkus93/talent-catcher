import { createClient } from "@/lib/supabase/server";

// Kandidaten-Gegenstück zu lib/queries/videos.ts::getVideosForTalent —
// gleiches Muster (signierte URL statt öffentlichem Link), nur gegen
// candidate_id statt talent_id (siehe Migration 20260822190000).
export interface CandidateVideo {
  id: string;
  candidateId: string;
  playbackUrl: string | null;
  fileSizeBytes: number | null;
  createdAt: string;
}

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function getVideosForCandidate(candidateId: string): Promise<CandidateVideo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("videos")
    .select("id, candidate_id, storage_key, file_size_bytes, created_at")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getVideosForCandidate() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Videos konnten nicht geladen werden.");
  }

  return Promise.all(
    (data ?? []).map(async (row: any) => {
      const { data: signed } = await supabase.storage
        .from("videos")
        .createSignedUrl(row.storage_key, SIGNED_URL_TTL_SECONDS);

      return {
        id: row.id,
        candidateId: row.candidate_id,
        playbackUrl: signed?.signedUrl ?? null,
        fileSizeBytes: row.file_size_bytes,
        createdAt: row.created_at,
      };
    })
  );
}
