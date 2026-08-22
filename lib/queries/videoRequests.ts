import { createClient } from "@/lib/supabase/server";

export interface VideoRequest {
  id: string;
  talentId: string;
  note: string | null;
  status: "offen" | "erledigt";
  createdAt: string;
  fulfilledAt: string | null;
  requestedByEmail: string | null;
}

export async function getVideoRequestsForTalent(talentId: string): Promise<VideoRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("video_requests")
    .select(
      "id, talent_id, note, status, created_at, fulfilled_at, requester:users!requested_by(email)"
    )
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getVideoRequestsForTalent() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Video-Anfragen konnten nicht geladen werden.");
  }

  return (data ?? []).map((row: any) => {
    const requester = Array.isArray(row.requester) ? row.requester[0] : row.requester;
    return {
      id: row.id,
      talentId: row.talent_id,
      note: row.note,
      status: row.status,
      createdAt: row.created_at,
      fulfilledAt: row.fulfilled_at,
      requestedByEmail: requester?.email ?? null,
    };
  });
}

export async function getOpenVideoRequest(talentId: string): Promise<VideoRequest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("video_requests")
    .select("id, talent_id, note, status, created_at, fulfilled_at")
    .eq("talent_id", talentId)
    .eq("status", "offen")
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    talentId: data.talent_id,
    note: data.note,
    status: data.status,
    createdAt: data.created_at,
    fulfilledAt: data.fulfilled_at,
    requestedByEmail: null,
  };
}

// Kandidaten-Gegenstück (siehe Migration 20260822190000) — gleiche Form,
// aber gegen candidate_id statt talent_id. Für die Vereinsseite (Scout-
// Übersicht über mehrere Kandidaturen auf einmal, siehe
// getOpenVideoRequestsForCandidates) UND die Kandidat:innen-/
// Eltern-Seite (immer genau eine Kandidatur je Aufruf).
export interface CandidateVideoRequest {
  id: string;
  candidateId: string;
  note: string | null;
  status: "offen" | "erledigt";
  createdAt: string;
  fulfilledAt: string | null;
}

export async function getOpenVideoRequestForCandidate(
  candidateId: string
): Promise<CandidateVideoRequest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("video_requests")
    .select("id, candidate_id, note, status, created_at, fulfilled_at")
    .eq("candidate_id", candidateId)
    .eq("status", "offen")
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    candidateId: data.candidate_id,
    note: data.note,
    status: data.status,
    createdAt: data.created_at,
    fulfilledAt: data.fulfilled_at,
  };
}

// Für die Kandidaten-Übersicht im Verein: offene Anfragen für mehrere
// Kandidaturen auf einmal statt N+1 Einzelabfragen.
export async function getOpenVideoRequestsForCandidates(
  candidateIds: string[]
): Promise<Map<string, CandidateVideoRequest>> {
  if (candidateIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("video_requests")
    .select("id, candidate_id, note, status, created_at, fulfilled_at")
    .in("candidate_id", candidateIds)
    .eq("status", "offen");

  if (error) {
    console.error("getOpenVideoRequestsForCandidates() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return new Map();
  }

  const map = new Map<string, CandidateVideoRequest>();
  for (const row of data ?? []) {
    map.set(row.candidate_id, {
      id: row.id,
      candidateId: row.candidate_id,
      note: row.note,
      status: row.status,
      createdAt: row.created_at,
      fulfilledAt: row.fulfilled_at,
    });
  }
  return map;
}
