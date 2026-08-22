import { createClient } from "@/lib/supabase/server";
import type { GuardianTalent, GuardianInvite, GuardianCandidate } from "@/lib/types";

function mapGuardianTalent(row: any): GuardianTalent {
  return {
    id: String(row.id),
    clubId: String(row.club_id),
    firstName: String(row.first_name ?? ""),
    lastName: String(row.last_name ?? ""),
    birthDate: String(row.birth_date ?? ""),
    primaryPosition: String(row.primary_position ?? ""),
    secondaryPosition: row.secondary_position ?? null,
    clubNameText: row.club_name_text ?? null,
    teamNameText: row.team_name_text ?? null,
    leagueText: row.league_text ?? null,
    countryText: row.country_text ?? null,
    isMinor: Boolean(row.is_minor),
    updatedAt: row.updated_at,
  };
}

// Für Eltern-Accounts: alle Talente (i. d. R. genau eines, mehrere
// Kinder möglich), auf die talent_guardians sie verknüpft.
export async function getGuardianTalents(): Promise<GuardianTalent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talent_family_view")
    .select("*")
    .order("first_name", { ascending: true });

  if (error) {
    console.error("getGuardianTalents() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Talente konnten nicht geladen werden.");
  }

  return (data ?? []).map(mapGuardianTalent);
}

export async function getGuardianTalent(
  talentId: string
): Promise<GuardianTalent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talent_family_view")
    .select("*")
    .eq("id", talentId)
    .maybeSingle();

  if (error) {
    console.error("getGuardianTalent() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Talent konnte nicht geladen werden.");
  }

  return data ? mapGuardianTalent(data) : null;
}

// Für Scouts: Übersicht der für ein Talent eingeladenen/verknüpften
// Eltern-Konten (Einladungsstatus).
export async function getGuardianInvitesForTalent(
  talentId: string
): Promise<GuardianInvite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talent_guardians")
    .select("id, email, invited_at, claimed_at")
    .eq("talent_id", talentId)
    .order("invited_at", { ascending: false });

  if (error) {
    console.error("getGuardianInvitesForTalent() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Eltern-Einladungen konnten nicht geladen werden.");
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    invitedAt: row.invited_at,
    claimedAt: row.claimed_at,
  }));
}

// Für Eltern-/Spieler-Accounts: eigene, noch nicht entschiedene
// Bewerbung(en) — siehe talent_candidates_select_guardian (Migration
// 20260822190000). Bereits angenommene/abgelehnte Kandidaturen tauchen
// hier bewusst nicht mehr auf: eine angenommene Kandidatur ist über
// getGuardianTalents() als reguläres Talent sichtbar, eine abgelehnte
// braucht keine weitere Aktion mehr von der bewerbenden Person.
export async function getMyCandidatures(): Promise<GuardianCandidate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talent_candidates")
    .select(
      "id, club_id, first_name, last_name, birth_date, primary_position, is_minor, status, created_at, club:clubs(name)"
    )
    .in("status", ["pending_review", "pending_payment", "pending_guardian_consent"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getMyCandidatures() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Bewerbungen konnten nicht geladen werden.");
  }

  return (data ?? []).map((row: any) => {
    const club = Array.isArray(row.club) ? row.club[0] : row.club;
    return {
      id: String(row.id),
      clubId: String(row.club_id),
      clubName: String(club?.name ?? ""),
      firstName: String(row.first_name ?? ""),
      lastName: String(row.last_name ?? ""),
      birthDate: String(row.birth_date ?? ""),
      primaryPosition: String(row.primary_position ?? ""),
      isMinor: Boolean(row.is_minor),
      status: row.status,
      createdAt: row.created_at,
    };
  });
}

export async function getMyCandidature(candidateId: string): Promise<GuardianCandidate | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talent_candidates")
    .select(
      "id, club_id, first_name, last_name, birth_date, primary_position, is_minor, status, created_at, club:clubs(name)"
    )
    .eq("id", candidateId)
    .maybeSingle();

  if (error || !data) return null;

  const club = Array.isArray((data as any).club) ? (data as any).club[0] : (data as any).club;
  return {
    id: String(data.id),
    clubId: String(data.club_id),
    clubName: String(club?.name ?? ""),
    firstName: String(data.first_name ?? ""),
    lastName: String(data.last_name ?? ""),
    birthDate: String(data.birth_date ?? ""),
    primaryPosition: String(data.primary_position ?? ""),
    isMinor: Boolean(data.is_minor),
    status: data.status,
    createdAt: data.created_at,
  };
}
