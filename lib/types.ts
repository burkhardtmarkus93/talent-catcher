// Diese Typen spiegeln das im Datenmodell-Dokument definierte SQL-Schema.
// Sobald `supabase gen types typescript` läuft, können sie durch die
// generierten Typen ersetzt bzw. mit ihnen abgeglichen werden.

// Technische Rollenwerte — verbindlich seit der Kickoff-Anweisung:
// nur diese drei Strings, "verein" ist ab jetzt reine Fachsprache,
// kein Rollenwert mehr im Code.

export type TalentStatus =
  | "in_beobachtung"
  | "empfehlung"
  | "abgeschlossen"
  | "verloren";

export type RiskLevel = "rot" | "gelb" | "gruen";

export type ReminderStatus = "offen" | "ueberfaellig" | "erledigt";

export type Alert = {
  id: string;
  talentId: string;
  riskLevel: RiskLevel;
  riskScore: number;
  triggeredReasons: string[];
  isHiddenGem: boolean;
  calculatedAt: string | null;
};

export type Talent = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  primaryPosition: string;
  secondaryPosition: string | null;
  clubNameText: string | null;
  teamNameText: string | null;
  leagueText: string | null;
  countryText: string | null;
  contractStatus: string;
  contractEndDate: string | null;
  status: TalentStatus;
  isMinor: boolean;
  visibilityStatus: string;
  archivedAt: string | null;
  currentAlert?: Alert;
  lastReportDate: string | null;
};

export type ScoutReport = {
  id: string;
  talentId: string;
  authorName: string;
  matchDate: string;
  opponent: string | null;
  scoreTechnik: number | null;
  scoreTaktik: number | null;
  scoreAthletik: number | null;
  scoreMentalitaet: number | null;
  overallRating: number;
  overallRatingSource: string;
  comment: string | null;
  createdAt: string;
};

export type Reminder = {
  id: string;
  talentId: string;
  talentName: string;
  dueDate: string;
  reason: string | null;
  status: ReminderStatus;
  isSystemGenerated: boolean;
};
