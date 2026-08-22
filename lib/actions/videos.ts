"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";
import { hasGrantedVideoConsent } from "@/lib/queries/consent";
import { getGuardianTalent } from "@/lib/queries/guardians";
import {
  getOpenVideoRequest,
  getOpenVideoRequestForCandidate,
} from "@/lib/queries/videoRequests";

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

  const isGuardian = appUser.role === "parent" || appUser.role === "player";
  let isMinor: boolean;

  if (isGuardian) {
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

  // Uploads von Eltern-/Spieler-Seite nur, solange der Verein aktiv ein
  // Video angefordert hat — verhindert unaufgeforderte Uploads, mit
  // denen Scouts sonst zugespamt würden. Der Verein selbst (Scout/Admin)
  // darf weiterhin jederzeit direkt hochladen, siehe else-Zweig oben.
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

// Nur Vereinsseite (Scout/Admin) darf Videos anfordern — Eltern/Spieler
// sehen die Anfrage nur lesend (video_requests_select_guardian), siehe
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

// --- Kandidaten-Gegenstücke (siehe Migration 20260822190000) ---
// Bewusst eigene Funktionen statt Umbau der obigen talentId-Funktionen:
// die RLS-Prüfung (talents vs. talent_candidates) unterscheidet sich
// genug, dass ein gemeinsamer Parameter-Union hier mehr Verwirrung als
// Nutzen stiften würde — gleiches Prinzip wie die getrennten
// Guardian-/Scout-Funktionen an anderer Stelle im Projekt.

export interface CreateCandidateVideoRecordInput {
  candidateId: string;
  storageKey: string;
  fileSizeBytes: number;
}

export async function createCandidateVideoRecord(
  input: CreateCandidateVideoRecordInput
): Promise<{ success: boolean; error?: string }> {
  const t = await getTranslations("videoActions");
  const appUser = await getCurrentAppUser();
  if (!appUser) {
    return { success: false, error: t("notAuthenticated") };
  }

  const supabase = await createClient();
  const isGuardian = appUser.role === "parent" || appUser.role === "player";

  // Kein separates Consent-Gate wie bei bereits angenommenen Talenten
  // (hasGrantedVideoConsent): die hochladende Person ist hier immer
  // dieselbe, die die Kandidatur selbst eingereicht und bezahlt hat
  // (Erziehungsberechtigte/r bzw. die volljährige Person selbst) — der
  // Upload-Vorgang IST hier die Einwilligung, es gibt (anders als beim
  // späteren Talent-Video) keine zweite, unabhängige Partei, die erst
  // noch zustimmen müsste. Falls das anders bewertet werden soll, bitte
  // gegenprüfen, bevor produktiv genutzt.
  if (isGuardian) {
    const { data: candidate, error: candidateError } = await supabase
      .from("talent_candidates")
      .select("id")
      .eq("id", input.candidateId)
      .maybeSingle();
    if (candidateError || !candidate) {
      return { success: false, error: t("talentNotFound") };
    }
  } else {
    if (!appUser.clubId) {
      return { success: false, error: t("notAuthenticated") };
    }
    const { data: candidate, error: candidateError } = await supabase
      .from("talent_candidates")
      .select("id, club_id")
      .eq("id", input.candidateId)
      .maybeSingle();
    if (candidateError || !candidate || candidate.club_id !== appUser.clubId) {
      return { success: false, error: t("talentNotFound") };
    }
  }

  if (isGuardian) {
    const openRequest = await getOpenVideoRequestForCandidate(input.candidateId);
    if (!openRequest) {
      return { success: false, error: t("noRequest") };
    }
  }

  const { error } = await supabase.from("videos").insert({
    candidate_id: input.candidateId,
    uploaded_by: appUser.id,
    storage_key: input.storageKey,
    file_size_bytes: input.fileSizeBytes,
  });

  if (error) {
    console.error("createCandidateVideoRecord() fehlgeschlagen:", {
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

export async function requestCandidateVideoUpload(formData: FormData): Promise<void> {
  const t = await getTranslations("videoActions");
  const candidateId = String(formData.get("candidateId") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!candidateId) {
    throw new Error(t("talentIdMissing"));
  }

  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId) {
    throw new Error(t("notAuthenticated"));
  }

  const supabase = await createClient();
  const { data: candidate, error: candidateError } = await supabase
    .from("talent_candidates")
    .select("id, club_id, is_minor")
    .eq("id", candidateId)
    .maybeSingle();

  if (candidateError || !candidate || candidate.club_id !== appUser.clubId) {
    throw new Error(t("talentNotFound"));
  }
  if (candidate.is_minor && !appUser.hasYouthAccess) {
    throw new Error(t("youthAccessRequired"));
  }

  const { error } = await supabase.from("video_requests").insert({
    candidate_id: candidateId,
    requested_by: appUser.id,
    note,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error(t("requestAlreadyOpen"));
    }
    console.error("requestCandidateVideoUpload() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(t("requestCreateFailed"));
  }

  revalidatePath("/candidates");
}

export async function cancelCandidateVideoRequest(formData: FormData): Promise<void> {
  const t = await getTranslations("videoActions");
  const candidateId = String(formData.get("candidateId") ?? "");
  const requestId = String(formData.get("requestId") ?? "");

  if (!candidateId || !requestId) {
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
    .eq("candidate_id", candidateId)
    .eq("status", "offen");

  if (error) {
    console.error("cancelCandidateVideoRequest() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(t("requestCancelFailed"));
  }

  revalidatePath("/candidates");
}
