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

// Labels sind übersetzbarer UI-Text und liegen in messages/*.json unter
// dem Namespace "importFields" (key "" -> Übersetzungsschlüssel "none") —
// ColumnMapper.tsx löst sie anhand von `key` auf.
export const IMPORT_SYSTEM_FIELDS: { key: ImportFieldKey | "" }[] = [
  { key: "" },
  { key: "firstName" },
  { key: "lastName" },
  { key: "birthDate" },
  { key: "primaryPosition" },
  { key: "clubNameText" },
  { key: "teamNameText" },
  { key: "leagueText" },
  { key: "contractStatus" },
  { key: "contractEndDate" },
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
