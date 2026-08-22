"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";

// Sportliche Vita zu einer noch offenen Bewerbung — anders als beim
// Video bewusst OHNE vorherige Anfrage des Vereins (siehe
// Migrationskommentar 20260822190000): ein schriftlicher Lebenslauf ist
// kein Spam-Risiko und liegt bei einer Bewerbung typischerweise ohnehin
// schon vor, die/der Bewerbende kann ihn daher jederzeit während
// 'pending_review' anhängen.

export interface CreateCandidateDocumentInput {
  candidateId: string;
  storageKey: string;
  fileType: "pdf" | "docx" | "image" | "other";
  fileSizeBytes: number;
}

export async function createCandidateDocumentRecord(
  input: CreateCandidateDocumentInput
): Promise<{ success: boolean; error?: string }> {
  const t = await getTranslations("candidateDocumentActions");
  const appUser = await getCurrentAppUser();
  if (!appUser) {
    return { success: false, error: t("notAuthenticated") };
  }

  const supabase = await createClient();
  const isGuardian = appUser.role === "parent" || appUser.role === "player";

  const { data: candidate, error: candidateError } = await supabase
    .from("talent_candidates")
    .select("id, club_id")
    .eq("id", input.candidateId)
    .maybeSingle();

  if (candidateError || !candidate) {
    return { success: false, error: t("candidateNotFound") };
  }
  if (!isGuardian && candidate.club_id !== appUser.clubId) {
    return { success: false, error: t("candidateNotFound") };
  }

  const { error } = await supabase.from("documents").insert({
    candidate_id: input.candidateId,
    uploaded_by: appUser.id,
    storage_key: input.storageKey,
    file_type: input.fileType,
    file_size_bytes: input.fileSizeBytes,
    description: "Sportliche Vita",
  });

  if (error) {
    console.error("createCandidateDocumentRecord() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { success: false, error: t("saveFailed") };
  }

  revalidatePath("/candidates");
  revalidatePath(`/parent/candidates/${input.candidateId}`);
  return { success: true };
}
