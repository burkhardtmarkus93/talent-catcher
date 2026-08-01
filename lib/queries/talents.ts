import { createClient } from "@/lib/supabase/server";
import type { Talent, Alert, ScoutReport, Reminder } from "@/lib/types";

type TalentFilters = {
  q?: string;
  showArchived?: boolean;
};

function mapAlert(row: any): Alert {
  return {
    id: String(row.id),
    talentId: String(row.talent_id),
    riskLevel: row.risk_level ?? "gruen",
    riskScore: Number(row.risk_score ?? 0),
    triggeredReasons: Array.isArray(row.triggered_reasons)
      ? row.triggered_reasons
      : [],
    isHiddenGem: Boolean(row.is_hidden_gem),
    calculatedAt: row.calculated_at ?? null,
  };
}

function mapTalent(row: any): Talent {
  const currentAlertRow = Array.isArray(row.alerts)
    ? row.alerts.find((a: any) => a?.is_current)
    : undefined;

  return {
    id: String(row.id),
    firstName: String(row.first_name ?? ""),
    lastName: String(row.last_name ?? ""),
    birthDate: String(row.birth_date ?? ""),
    primaryPosition: String(row.primary_position ?? ""),
    secondaryPosition: row.secondary_position ?? null,
    clubNameText: row.club_name_text ?? null,
    teamNameText: row.team_name_text ?? null,
    leagueText: row.league_text ?? null,
    countryText: row.country_text ?? null,
    contractStatus: row.contract_status ?? "unbekannt",
    contractEndDate: row.contract_end_date ?? null,
    status: row.status ?? "in_beobachtung",
    isMinor: Boolean(row.is_minor),
    visibilityStatus: row.visibility_status ?? "freigegeben",
    currentAlert: currentAlertRow ? mapAlert(currentAlertRow) : undefined,
    lastReportDate: null,
  };
}

function mapScoutReport(row: any): ScoutReport {
  return {
    id: row.id,
    talentId: row.talent_id,
    authorName: row.author?.email ?? "Unbekannt",
    matchDate: row.match_date,
    opponent: row.opponent,
    scoreTechnik: row.score_technik,
    scoreTaktik: row.score_taktik,
    scoreAthletik: row.score_athletik,
    scoreMentalitaet: row.score_mentalitaet,
    overallRating: Number(row.overall_rating),
    overallRatingSource: row.overall_rating_source,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

function mapReminder(row: any, talentName: string): Reminder {
  return {
    id: row.id,
    talentId: row.talent_id,
    talentName,
    dueDate: row.due_date,
    reason: row.reason,
    status: row.status,
    isSystemGenerated: row.is_system_generated,
  };
}

export async function getTalents(filters: TalentFilters = {}): Promise<Talent[]> {
  const supabase = await createClient();
  const q = filters.q?.trim().toLowerCase() ?? "";
  const showArchived = Boolean(filters.showArchived);

  let query = supabase
    .from("talents")
    .select("*")
    .order("last_name", { ascending: true });

  if (!showArchived) {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getTalents() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Talente konnten nicht geladen werden.");
  }

  const talents = (data ?? []).map(mapTalent);

  if (!q) return talents;

  return talents.filter((talent) => {
    const haystack = [
      talent.firstName,
      talent.lastName,
      talent.clubNameText ?? "",
      talent.teamNameText ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

export async function getTalentById(id: string): Promise<Talent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talents")
    .select("*, alerts(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getTalentById() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Talent konnte nicht geladen werden.");
  }

  return data ? mapTalent(data) : null;
}

export async function getScoutReportsForTalent(
  talentId: string
): Promise<ScoutReport[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scout_reports")
    .select("*, author:users(email)")
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getScoutReportsForTalent() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Berichte konnten nicht geladen werden.");
  }

  return (data ?? []).map(mapScoutReport);
}

export async function getOpenRemindersForClub(): Promise<Reminder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminders")
    .select("*, talents(first_name, last_name)")
    .in("status", ["offen", "ueberfaellig"])
    .order("due_date", { ascending: true });

  if (error) {
    console.error("getOpenRemindersForClub() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Wiedervorlagen konnten nicht geladen werden.");
  }

  return (data ?? []).map((row: any) =>
    mapReminder(
      row,
      row.talents ? `${row.talents.first_name} ${row.talents.last_name}` : "Unbekannt"
    )
  );
}

export async function getOpenRemindersForTalent(
  talentId: string,
  talentName: string
): Promise<Reminder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("talent_id", talentId)
    .in("status", ["offen", "ueberfaellig"])
    .order("due_date", { ascending: true });

  if (error) {
    console.error("getOpenRemindersForTalent() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Wiedervorlagen konnten nicht geladen werden.");
  }

  return (data ?? []).map((row) => mapReminder(row, talentName));
}
