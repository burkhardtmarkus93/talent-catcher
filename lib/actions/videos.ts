"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";
import { hasGrantedVideoConsent } from "@/lib/queries/consent";
import { getGuardianTalent } from "@/lib/queries/guardians";
import { getOpenVideoRequest } from "@/lib/queries/videoRequests";

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

  const isGuardian = appUser.role === "parent";
  let isMinor: boolean;

  if (isGuardian) {
    // Eltern haben keinen club_id und keine RLS-Policy auf public.talents
    // direkt (siehe Migration 20260816010000) — Zugriff/Existenz laufen
    // hier über die guardian-gescopte View, die zugleich beweist, dass
    // der Account wirklich mit genau diesem Talent verknüpft ist.
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

  // Uploads von Eltern-Seite nur, solange der Verein aktiv ein Video
  // angefordert hat — verhindert unaufgeforderte Uploads, mit denen
  // Scouts sonst zugespamt würden. Der Verein selbst (Scout/Admin) darf
  // weiterhin jederzeit direkt hochladen, siehe else-Zweig oben.
  if (isGuardian) {
    const openRequest = await getOpenVideoRequest(input.talentId);
    if (!openRequest) {
      return { success: false, error: t("noRequest") };
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

// Nur Vereinsseite (Scout/Admin) darf Videos anfordern — Eltern sehen
// die Anfrage nur lesend (video_requests_select_guardian), siehe
// Migration 20260821160000.
export async function requestVideoUpload(formData: FormData): Promise<void> {
  const t = await getTranslations("videoActions");
  const talentId = String(formData.get("talentId") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!talentId) {
    throw new Error(t("talentIdMissing"));
  }

  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId) {
    throw new Error(t("notAuthenticated"));
  }

  const supabase = await createClient();
  const { data: talent, error: talentError } = await supabase
    .from("talents")
    .select("id, club_id, is_minor")
    .eq("id", talentId)
    .maybeSingle();

  if (talentError || !talent || talent.club_id !== appUser.clubId) {
    throw new Error(t("talentNotFound"));
  }
  if (talent.is_minor && !appUser.hasYouthAccess) {
    throw new Error(t("youthAccessRequired"));
  }

  const { error } = await supabase.from("video_requests").insert({
    talent_id: talentId,
    requested_by: appUser.id,
    note,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error(t("requestAlreadyOpen"));
    }
    console.error("requestVideoUpload() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(t("requestCreateFailed"));
  }

  revalidatePath(`/talents/${talentId}`);
  revalidatePath(`/parent/talents/${talentId}`);
}

export async function cancelVideoRequest(formData: FormData): Promise<void> {
  const t = await getTranslations("videoActions");
  const talentId = String(formData.get("talentId") ?? "");
  const requestId = String(formData.get("requestId") ?? "");

  if (!talentId || !requestId) {
    throw new Error(t("talentIdMissing"));
  }

  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId) {
    throw new Error(t("notAuthenticated"));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("video_requests")
    .delete()
    .eq("id", requestId)
    .eq("talent_id", talentId)
    .eq("status", "offen");

  if (error) {
    console.error("cancelVideoRequest() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(t("requestCancelFailed"));
  }

  revalidatePath(`/talents/${talentId}`);
  revalidatePath(`/parent/talents/${talentId}`);
}
