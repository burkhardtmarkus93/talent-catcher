import { createClient } from "@/lib/supabase/server";
import type {
  Talent,
  Alert,
  ScoutReport,
  Reminder,
  TalentStatus,
  RiskLevel,
} from "@/lib/types";

type TalentFilters = {
  q?: string;
  showArchived?: boolean;
  position?: string;
  status?: string;
  alert?: string;
  hiddenGem?: string;
  dfbStuetzpunkt?: string;
  verbandsauswahl?: string;
  nationalmannschaft?: string;
  nlz?: string;
  euPassport?: string;
  perspektivkader?: string;
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

export function mapTalent(row: any): Talent {
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
    heightCm: row.height_cm ?? null,
    weightKg: row.weight_kg ?? null, 
    tags: Array.isArray(row.tags) ? row.tags : [],
    status: row.status ?? "in_beobachtung",
    isMinor: Boolean(row.is_minor),
    visibilityStatus: row.visibility_status ?? "freigegeben",
    archivedAt: row.archived_at ?? null,
    updatedAt: row.updated_at,
    currentAlert: currentAlertRow ? mapAlert(currentAlertRow) : undefined,
    lastReportDate: null,
    transfermarktUrl: row.transfermarkt_url ?? null,
    fupaUrl: row.fupa_url ?? null,
    dfbStuetzpunkt: Boolean(row.dfb_stuetzpunkt),
    verbandsauswahl: Boolean(row.verbandsauswahl),
    nationalmannschaft: Boolean(row.nationalmannschaft),
    nlz: Boolean(row.nlz),
    euPassport: Boolean(row.eu_passport),
    perspektivkader: Boolean(row.perspektivkader),
    upcomingTransferClubText: row.upcoming_transfer_club_text ?? null,
    upcomingTransferNote: row.upcoming_transfer_note ?? null,
    cohortPercentileBucket: row.cohort_percentile_bucket ?? null,
    cohortPercentileUpdatedAt: row.cohort_percentile_updated_at ?? null,
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
    tinderTrainingssensitivitaet: row.tinder_trainingssensitivitaet ?? null,
    tinderIntelligenz: row.tinder_intelligenz ?? null,
    tinderNaturell: row.tinder_naturell ?? null,
    tinderDynamik: row.tinder_dynamik ?? null,
    tinderErfolgsmotivation: row.tinder_erfolgsmotivation ?? null,
    tinderResilienz: row.tinder_resilienz ?? null,
    potenzial: row.potenzial ?? null,
    reifegrad: row.reifegrad ?? null,
    reviewedAt: row.reviewed_at ?? null,
    reviewedByName: row.reviewer?.email ?? null,
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
  const position = filters.position?.trim();
  const status = filters.status?.trim();
  const alert = filters.alert?.trim();
  const hiddenGem = filters.hiddenGem?.trim();
  const dfbStuetzpunkt = filters.dfbStuetzpunkt?.trim();
  const verbandsauswahl = filters.verbandsauswahl?.trim();
  const nationalmannschaft = filters.nationalmannschaft?.trim();
  const nlz = filters.nlz?.trim();
  const euPassport = filters.euPassport?.trim();
  const perspektivkader = filters.perspektivkader?.trim();

  let query = supabase
    .from("talents")
    .select("*, alerts(*)")
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

  let talents = (data ?? []).map(mapTalent);

  if (q) {
    talents = talents.filter((talent) => {
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

  if (position && position !== "alle") {
    talents = talents.filter((talent) => talent.primaryPosition === position);
  }

  if (status && status !== "alle") {
    talents = talents.filter((talent) => talent.status === (status as TalentStatus));
  }

  if (alert && alert !== "alle") {
    talents = talents.filter(
      (talent) => talent.currentAlert?.riskLevel === (alert as RiskLevel)
    );
  }

  if (hiddenGem && hiddenGem !== "alle") {
    talents = talents.filter((talent) => Boolean(talent.currentAlert?.isHiddenGem));
  }

  const flagFilters: [string | undefined, keyof Talent][] = [
    [dfbStuetzpunkt, "dfbStuetzpunkt"],
    [verbandsauswahl, "verbandsauswahl"],
    [nationalmannschaft, "nationalmannschaft"],
    [nlz, "nlz"],
    [euPassport, "euPassport"],
    [perspektivkader, "perspektivkader"],
  ];

  for (const [value, key] of flagFilters) {
    if (value && value !== "alle") {
      const wanted = value === "true";
      talents = talents.filter((talent) => Boolean(talent[key]) === wanted);
    }
  }

  return talents;
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
    .select("*, author:users!scout_reports_author_id_fkey(email), reviewer:users!scout_reports_reviewed_by_fkey(email)")
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

export async function getActiveTalentCount(clubId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("talents")
    .select("id", { count: "exact", head: true })
    .eq("club_id", clubId)
    .is("archived_at", null);

  if (error) {
    console.error("getActiveTalentCount() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Talent-Anzahl konnte nicht ermittelt werden.");
  }

  return count ?? 0;
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
