"use client";

import { useState } from "react";

const systemFields = [
  "— nicht importieren —",
  "Vorname",
  "Nachname",
  "Geburtsdatum",
  "Primäre Position",
  "Aktueller Verein",
  "Team/Jahrgang",
  "Liga",
  "Vertragsstatus",
  "Vertragsende",
];

// Demo-Header, wie sie nach dem Datei-Upload aus der ersten Zeile
// gelesen würden. Live ersetzt durch das tatsächliche Parsing-Ergebnis
// (siehe technischer Umsetzungsplan, /api/import).
const demoFileColumns = [
  { column: "Spielername", suggested: "Nachname" },
  { column: "Geb.Datum", suggested: "Geburtsdatum" },
  { column: "Pos", suggested: "Primäre Position" },
  { column: "Verein", suggested: "Aktueller Verein" },
  { column: "Jahrgang", suggested: "Team/Jahrgang" },
];

export function ColumnMapper() {
  const [mapping, setMapping] = useState<Record<string, string>>(
    Object.fromEntries(demoFileColumns.map((c) => [c.column, c.suggested]))
  );

  return (
    <div className="rounded-md border border-line bg-surface p-5">
      <h2 className="mb-4 font-display text-lg font-medium text-ink">
        Spalten-Zuordnung
      </h2>
      <div className="flex flex-col gap-3">
        {demoFileColumns.map(({ column }) => (
          <div key={column} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <span className="rounded-sm bg-paper px-3 py-2 text-sm text-ink">
              &quot;{column}&quot;
            </span>
            <span className="text-muted">→</span>
            <select
              value={mapping[column]}
              onChange={(e) =>
                setMapping((prev) => ({ ...prev, [column]: e.target.value }))
              }
              className="rounded-sm border border-line px-3 py-2 text-sm text-ink"
            >
              {systemFields.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
