import { createClient } from "@/lib/supabase/server";
import type { GuardianTalent, GuardianInvite } from "@/lib/types";

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
