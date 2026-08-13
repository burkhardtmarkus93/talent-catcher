// Zielfelder für den Talent-Import. Wird sowohl vom ColumnMapper (Client)
// als auch von der runImport-Server-Action genutzt — daher kein
// "use server", damit beide Seiten importieren können.

export type ImportFieldKey =
  | "firstName"
  | "lastName"
  | "birthDate"
  | "primaryPosition"
  | "clubNameText"
  | "teamNameText"
  | "leagueText"
  | "contractStatus"
  | "contractEndDate";

export const IMPORT_SYSTEM_FIELDS: { label: string; key: ImportFieldKey | "" }[] = [
  { label: "— nicht importieren —", key: "" },
  { label: "Vorname", key: "firstName" },
  { label: "Nachname", key: "lastName" },
  { label: "Geburtsdatum", key: "birthDate" },
  { label: "Primäre Position", key: "primaryPosition" },
  { label: "Aktueller Verein", key: "clubNameText" },
  { label: "Team/Jahrgang", key: "teamNameText" },
  { label: "Liga", key: "leagueText" },
  { label: "Vertragsstatus", key: "contractStatus" },
  { label: "Vertragsende", key: "contractEndDate" },
];

export const REQUIRED_IMPORT_FIELDS: ImportFieldKey[] = [
  "firstName",
  "lastName",
  "birthDate",
  "primaryPosition",
];

const SUGGESTION_PATTERNS: [RegExp, ImportFieldKey][] = [
  [/vorname|first.?name/, "firstName"],
  [/nachname|spielername|last.?name|name/, "lastName"],
  [/geburt|geb\.?\s*datum|birth/, "birthDate"],
  [/position|\bpos\b/, "primaryPosition"],
  [/verein|club/, "clubNameText"],
  [/team|jahrgang|mannschaft/, "teamNameText"],
  [/liga|league/, "leagueText"],
  [/vertragsstatus|contract.?status/, "contractStatus"],
  [/vertragsende|contract.?end/, "contractEndDate"],
];

// Grobe Heuristik, um nach dem Datei-Upload eine Startzuordnung
// vorzuschlagen. Der Nutzer kann jede Zuordnung manuell überschreiben.
export function suggestFieldForColumn(column: string): ImportFieldKey | "" {
  const normalized = column.trim().toLowerCase();
  for (const [pattern, key] of SUGGESTION_PATTERNS) {
    if (pattern.test(normalized)) return key;
  }
  return "";
}
