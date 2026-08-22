// Diese Typen spiegeln das im Datenmodell-Dokument definierte SQL-Schema.
// Sobald `supabase gen types typescript` läuft, können sie durch die
// generierten Typen ersetzt bzw. mit ihnen abgeglichen werden.
// Technische Rollenwerte — verbindlich seit der Kickoff-Anweisung:
// "verein" ist reine Fachsprache, kein Rollenwert mehr im Code.
// "parent" (Eltern-Zugang, siehe talent_guardians) hat bewusst keinen
// club_id — ein Elternteil gehört zu keinem Verein, sondern ist über
// talent_guardians an genau die Talente ihrer Kinder gebunden.
// "landesverband" (siehe Migration 20260819100000) hat ebenfalls keinen
// club_id, sondern landesverbandId — gebunden an alle Vereine, die sich
// diesem Landesverband zugeordnet haben (clubs.landesverband_id).
export type Role = "scout" | "club_admin" | "admin" | "parent" | "landesverband" | "player";

export interface AppUser {
  id: string;
  email: string;
  clubId: string | null;
  landesverbandId: string | null;
  role: Role;
  hasYouthAccess: boolean;
  clubPlan: "start" | "verein" | "verband" | null;
  hasSeenIntroTour: boolean;
}

// Eng geschnittene Sicht für Landesverbands-Accounts — bewusst nur
// unkritische Kern-Stammdaten freigegebener Talente, siehe
// landesverband_talents_view (Migration 20260819100000). Kein tags/
// status/Körpermaße/Scout-Berichte/Risikobewertung.
export interface LandesverbandTalent {
  id: string;
  clubId: string;
  clubRegisteredName: string;
  clubNameText: string | null;
  teamNameText: string | null;
  firstName: string;
  lastName: string;
  birthDate: string;
  primaryPosition: string;
  secondaryPosition: string | null;
  isMinor: boolean;
  dfbStuetzpunkt: boolean;
  verbandsauswahl: boolean;
  nationalmannschaft: boolean;
  nlz: boolean;
  euPassport: boolean;
  updatedAt: string;
}

export interface Landesverband {
  id: string;
  name: string;
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
  euPassport: boolean;
  upcomingTransferClubText?: string | null;
  upcomingTransferNote?: string | null;
  cohortPercentileBucket?: CohortPercentileBucket | null;
  cohortPercentileUpdatedAt?: string | null;
}

// Grober Positions-/Jahrgangs-Vergleich, siehe Migration 20260822200000
// und app/api/cron/recalculate-talent-cohort-percentiles — bewusst nur
// vier grobe Quartile, kein Score/Rang, keine Auskunft über andere
// Vereine/Talente in der Vergleichsgruppe.
export type CohortPercentileBucket = "top25" | "upper_mid" | "lower_mid" | "bottom25";

export interface Alert {
  id: string;
  talentId: string;
  riskLevel: RiskLevel;
  riskScore: number;
  triggeredReasons: (string | RiskReason)[];
  isHiddenGem: boolean;
  calculatedAt: string;
}

// Strukturierter Alert-Grund statt fertigem Text, damit die Begründung
// erst beim Anzeigen (mit der jeweiligen Portalsprache) übersetzt wird —
// siehe riskReasonLabel() in app/(dashboard)/talents/[talentId]/page.tsx.
// Bereits gespeicherte Alerts von vor dieser Umstellung liegen weiterhin
// als reiner String vor (triggeredReasons ist deshalb bewusst ein Union-
// Typ) und werden unverändert (auf Deutsch) angezeigt, bis das jeweilige
// Talent das nächste Mal neu bewertet wird — für Talente mit
// status='verloren' passiert das laut riskEngine.ts nie mehr, ihr letzter
// Alert bleibt also dauerhaft im alten Format.
export interface RiskReason {
  code: string;
  params?: Record<string, string | number>;
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
  reviewedAt?: string | null;
  reviewedByName?: string | null;
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

// Öffentliches Vereinsverzeichnis fürs Registrierungsformular (siehe
// public_club_directory, Migration 20260821100000) — bewusst nur id+Name.
export interface PublicClubOption {
  id: string;
  name: string;
}

export type TalentCandidateStatus =
  | "pending_guardian_consent"
  | "pending_payment"
  | "pending_review"
  | "accepted"
  | "declined";

// Spieler-Selbstregistrierung, die einem einzelnen Verein vorgeschlagen
// wird (siehe talent_candidates, Migration 20260821100000). Scouts/Admins
// sehen über die RLS-Policy talent_candidates_select_same_club nur
// Kandidaturen im Status pending_review/accepted/declined — bei
// Minderjährigen erst nach bestätigter Erziehungsberechtigten-Einwilligung.
export interface TalentCandidate {
  id: string;
  clubId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  primaryPosition: string;
  contactEmail: string;
  isMinor: boolean;
  guardianEmail: string | null;
  guardianConfirmedAt: string | null;
  status: TalentCandidateStatus;
  createdAt: string;
}

// Eng geschnittene Sicht für Eltern-/Spieler-Accounts auf die eigene(n)
// noch offene(n) Bewerbung(en) — analog zu GuardianTalent, aber vor der
// Annahme durch den Verein (siehe Migration 20260822190000).
export interface GuardianCandidate {
  id: string;
  clubId: string;
  clubName: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  primaryPosition: string;
  isMinor: boolean;
  status: TalentCandidateStatus;
  createdAt: string;
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
