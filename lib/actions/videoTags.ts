"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Zeitmarken auf Video-Highlights (Migration 20260823110000) — bewusst
// schlanker Server-Action-Flow ohne eigenes Formular-State-Handling wie
// bei createScoutReport, da hier kein mehrstufiges Validierungsfeedback
// nötig ist (nur eine Zahl + ein kurzer Text).
export async function addVideoTag(
  videoId: string,
  talentId: string,
  timestampSeconds: number,
  label: string
) {
  const trimmedLabel = label.trim();
  if (!trimmedLabel || !Number.isFinite(timestampSeconds) || timestampSeconds < 0) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase.from("video_tags").insert({
    video_id: videoId,
    created_by: user.id,
    timestamp_seconds: Math.floor(timestampSeconds),
    label: trimmedLabel,
  });

  if (error) {
    console.error("addVideoTag() fehlgeschlagen:", error.message);
    return;
  }

  revalidatePath(`/talents/${talentId}`);
}

export async function deleteVideoTag(tagId: string, talentId: string) {
  const supabase = await createClient();

  // Keine explizite Rollenprüfung nötig: die RLS-Policy
  // video_tags_delete_own (Migration 20260823110000) lässt ohnehin nur
  // die eigene Markierung zu — ein Löschversuch für eine fremde
  // Markierung betrifft dadurch einfach 0 Zeilen, ohne Fehler.
  const { error } = await supabase.from("video_tags").delete().eq("id", tagId);

  if (error) {
    console.error("deleteVideoTag() fehlgeschlagen:", error.message);
    return;
  }

  revalidatePath(`/talents/${talentId}`);
}
