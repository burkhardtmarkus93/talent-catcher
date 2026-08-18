// Diese Typen spiegeln das im Datenmodell-Dokument definierte SQL-Schema.
// Sobald `supabase gen types typescript` läuft, können sie durch die
// generierten Typen ersetzt bzw. mit ihnen abgeglichen werden.
// Technische Rollenwerte — verbindlich seit der Kickoff-Anweisung:
// "verein" ist reine Fachsprache, kein Rollenwert mehr im Code.
// "parent" (Eltern-Zugang, siehe talent_guardians) hat bewusst keinen
// club_id — ein Elternteil gehört zu keinem Verein, sondern ist über
// talent_guardians an genau die Talente ihrer Kinder gebunden.
export type Role = "scout" | "club_admin" | "admin" | "parent";

export interface AppUser {
  id: string;
  email: string;
  clubId: string | null;
  role: Role;
  hasYouthAccess: boolean;
  clubPlan: "start" | "verein" | "verband" | null;
  hasSeenIntroTour: boolean;
}

// Eng geschnittene Sicht für Eltern-Accounts — bewusst nur Stammdaten,
// siehe talent_family_view (Migration 20260816010000). Kein tags/status/
// visibility_status/upcoming_transfer_*/Risikobewertung.
export interface GuardianTalent {
  id: string;
  clubId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  primaryPosition: string;
  secondaryPosition: string | null;
  clubNameText: string | null;
  teamNameText: string | null;
  leagueText: string | null;
  countryText: string | null;
  isMinor: boolean;
  updatedAt: string;
}

export interface GuardianInvite {
  id: string;
  email: string;
  invitedAt: string;
  claimedAt: string | null;
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
  birthDate: string; // ISO-Datum
  primaryPosition: string;
  secondaryPosition?: string | null;
  clubNameText: string;
  teamNameText?: string | null;
  leagueText?: string | null;
  countryText?: string | null;
  contractStatus: ContractStatus;
  contractEndDate?: string | null;
  heightCm?: number | null;
  weightKg?: number | null; 
  tags?: string[];
  status: TalentStatus;
  isMinor: boolean;
  visibilityStatus: "privat" | "freigegeben";
  archivedAt: string | null;
  updatedAt: string;
  currentAlert?: Alert;
  lastReportDate?: string | null;
  transfermarktUrl?: string | null;
  fupaUrl?: string | null;
  dfbStuetzpunkt: boolean;
  verbandsauswahl: boolean;
  nationalmannschaft: boolean;
  nlz: boolean;
  upcomingTransferClubText?: string | null;
  upcomingTransferNote?: string | null;
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
  opponent?: string | null;
  scoreTechnik: number;
  scoreTaktik: number;
  scoreAthletik: number;
  scoreMentalitaet: number;
  overallRating: number;
  overallRatingSource: "calculated" | "manual_override";
  comment?: string | null;
  createdAt: string;
  tinderTrainingssensitivitaet?: number | null;
  tinderIntelligenz?: number | null;
  tinderNaturell?: number | null;
  tinderDynamik?: number | null;
  tinderErfolgsmotivation?: number | null;
  tinderResilienz?: number | null;
  potenzial?: number | null;
  reifegrad?: number | null;
}

export type ReminderStatus = "offen" | "erledigt" | "ueberfaellig";

export interface Reminder {
  id: string;
  talentId: string;
  talentName: string;
  dueDate: string;
  reason?: string | null;
  status: ReminderStatus;
  isSystemGenerated: boolean;
}

export interface Watchlist {
  id: string;
  name: string;
  description?: string | null;
  talentCount: number;
}

export interface ImportJobPreview {
  id: string;
  sourceFilename: string;
  status:
    | "laeuft"
    | "abgeschlossen"
    | "fehlgeschlagen"
    | "teilweise_fehlgeschlagen";
  totalRows: number;
  importedRows: number;
  errorRows: number;
  startedAt: string;
  errorReport?: { row: number; reason: string }[] | null;
}
