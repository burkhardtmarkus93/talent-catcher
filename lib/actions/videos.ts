"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";
import { hasGrantedVideoConsent } from "@/lib/queries/consent";
import { getGuardianTalent } from "@/lib/queries/guardians";

export interface CreateVideoRecordInput {
  talentId: string;
  storageKey: string;
  fileSizeBytes: number;
}

// Nimmt nur Metadaten entgegen — die Datei selbst wurde bereits direkt
// vom Browser in den Storage-Bucket hochgeladen (siehe
// components/videos/VideoUploadForm.tsx für die Begründung).
export async function createVideoRecord(
  input: CreateVideoRecordInput
): Promise<{ success: boolean; error?: string }> {
  const t = await getTranslations("videoActions");
  const appUser = await getCurrentAppUser();
  if (!appUser) {
    return { success: false, error: t("notAuthenticated") };
  }

  const supabase = await createClient();

  let isMinor: boolean;

  if (appUser.role === "parent" || appUser.role === "player") {
    // Eltern/Spieler haben keinen club_id und keine RLS-Policy auf
    // public.talents direkt (siehe Migration 20260816010000) — Zugriff/
    // Existenz laufen hier über die guardian-gescopte View, die zugleich
    // beweist, dass der Account wirklich mit genau diesem Talent
    // verknüpft ist.
    const guardianTalent = await getGuardianTalent(input.talentId);
    if (!guardianTalent) {
      return { success: false, error: t("talentNotFound") };
    }
    isMinor = guardianTalent.isMinor;
  } else {
    if (!appUser.clubId) {
      return { success: false, error: t("notAuthenticated") };
    }

    const { data: talent, error: talentError } = await supabase
      .from("talents")
      .select("id, club_id, is_minor")
      .eq("id", input.talentId)
      .maybeSingle();

    if (talentError || !talent || talent.club_id !== appUser.clubId) {
      return { success: false, error: t("talentNotFound") };
    }
    isMinor = talent.is_minor;
  }

  // Defense-in-depth: die Upload-Form blendet sich für minderjährige
  // Talente ohne Einwilligung zwar bereits aus, aber Client-seitiges
  // Ausblenden allein ist bei sensiblen Jugendschutz-Daten kein
  // verlässlicher Schutz — deshalb hier nochmal serverseitig geprüft.
  if (isMinor) {
    const consented = await hasGrantedVideoConsent(input.talentId);
    if (!consented) {
      return {
        success: false,
        error: t("noConsent"),
      };
    }
  }

  const { error } = await supabase.from("videos").insert({
    talent_id: input.talentId,
    uploaded_by: appUser.id,
    storage_key: input.storageKey,
    file_size_bytes: input.fileSizeBytes,
  });

  if (error) {
    console.error("createVideoRecord() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { success: false, error: t("saveFailed") };
  }

  revalidatePath(`/talents/${input.talentId}`);
  revalidatePath(`/parent/talents/${input.talentId}`);
  return { success: true };
}
