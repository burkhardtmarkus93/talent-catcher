// Diese Typen spiegeln das im Datenmodell-Dokument definierte SQL-Schema.
// Sobald `supabase gen types typescript` läuft, können sie durch die
// generierten Typen ersetzt bzw. mit ihnen abgeglichen werden.

// Technische Rollenwerte — verbindlich seit der Kickoff-Anweisung:
// nur diese drei Strings, "verein" ist ab jetzt reine Fachsprache,
// kein Rollenwert mehr im Code.
export type Role = "scout" | "club_admin" | "admin";

export interface AppUser {
  id: string;
  email: string;
  clubId: string | null;
  role: Role;
  hasYouthAccess: boolean;
}

export type RiskLevel = "gruen" | "gelb" | "rot";

export type TalentStatus =
  | "in_beobachtung"
  | "empfehlung"
  | "abgeschlossen"
  | "verloren";

export type ContractStatus = "aktiv" | "auslaufend" | "vereinslos" | "unbekannt";

export interface Talent {
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
  contractStatus: ContractStatus;
  contractEndDate: string | null;
  status: TalentStatus;
  isMinor: boolean;
  visibilityStatus: "privat" | "freigegeben";
  archived_at: string | null;
  currentAlert?: Alert;
  lastReportDate: string | null;
}

export interface Alert {
  id: string;
  talentId: string;
  riskLevel: RiskLevel;
  riskScore: number;
  triggeredReasons: string[];
  isHiddenGem: boolean;
  calculatedAt: string;
}

export interface ScoutReport {
  id: string;
  talentId: string;
  authorName: string;
  matchDate: string;
  opponent: string | null;
  scoreTechnik: number;
  scoreTaktik: number;
  scoreAthletik: number;
  scoreMentalitaet: number;
  overallRating: number;
  overallRatingSource: "calculated" | "manual_override";
  comment: string | null;
  createdAt: string;
}

export type ReminderStatus = "offen" | "erledigt" | "ueberfaellig" | "storniert";

export interface Reminder {
  id: string;
  talentId: string;
  talentName: string;
  dueDate: string;
  reason: string | null;
  status: ReminderStatus;
  isSystemGenerated: boolean;
}

export interface Watchlist {
  id: string;
  name: string;
  description: string | null;
  talentCount: number;
}

export interface ImportJobPreview {
  id: string;
  sourceFilename: string;
  status: "laeuft" | "abgeschlossen" | "fehlgeschlagen" | "teilweise_fehlgeschlagen";
  totalRows: number;
  importedRows: number;
  errorRows: number;
  startedAt: string;
}
