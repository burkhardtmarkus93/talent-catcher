import { createClient } from "@/lib/supabase/server";

// Zeitmarken auf Video-Highlights, siehe Migration 20260823110000 —
// rein additive Scouting-Komfortfunktion, kein Einfluss auf Risk-Engine
// oder sonstige Bewertung.
export interface VideoTag {
  id: string;
  timestampSeconds: number;
  label: string;
  createdByEmail: string | null;
}

export interface TalentVideo {
  id: string;
  talentId: string;
  playbackUrl: string | null;
  fileSizeBytes: number | null;
  durationSeconds: number | null;
  createdAt: string;
  uploaderEmail: string | null;
  tags: VideoTag[];
}

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function getVideosForTalent(talentId: string): Promise<TalentVideo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("videos")
    .select(
      "id, talent_id, storage_key, file_size_bytes, duration_seconds, created_at, uploader:users!uploaded_by(email), tags:video_tags(id, timestamp_seconds, label, creator:users!created_by(email))"
    )
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getVideosForTalent() fehlgeschlagen:", {
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

      const uploader = Array.isArray(row.uploader) ? row.uploader[0] : row.uploader;

      const tags: VideoTag[] = (Array.isArray(row.tags) ? row.tags : [])
        .map((tagRow: any) => {
          const creator = Array.isArray(tagRow.creator) ? tagRow.creator[0] : tagRow.creator;
          return {
            id: tagRow.id,
            timestampSeconds: tagRow.timestamp_seconds,
            label: tagRow.label,
            createdByEmail: creator?.email ?? null,
          };
        })
        .sort((a: VideoTag, b: VideoTag) => a.timestampSeconds - b.timestampSeconds);

      return {
        id: row.id,
        talentId: row.talent_id,
        playbackUrl: signed?.signedUrl ?? null,
        fileSizeBytes: row.file_size_bytes,
        durationSeconds: row.duration_seconds,
        createdAt: row.created_at,
        uploaderEmail: uploader?.email ?? null,
        tags,
      };
    })
  );
}
