"use client";

import { IMPORT_SYSTEM_FIELDS, type ImportFieldKey } from "@/lib/import/fields";

interface ColumnMapperProps {
  headers: string[];
  mapping: Record<string, ImportFieldKey | "">;
  onChange: (column: string, field: ImportFieldKey | "") => void;
}

export function ColumnMapper({ headers, mapping, onChange }: ColumnMapperProps) {
  return (
    <div className="rounded-md border border-line bg-surface p-5">
      <h2 className="mb-4 font-display text-lg font-medium text-ink">
        Spalten-Zuordnung
      </h2>
      <div className="flex flex-col gap-3">
        {headers.map((column) => (
          <div key={column} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <span className="rounded-sm bg-paper px-3 py-2 text-sm text-ink">
              &quot;{column}&quot;
            </span>
            <span className="text-muted">→</span>
            <select
              value={mapping[column] ?? ""}
              onChange={(e) =>
                onChange(column, e.target.value as ImportFieldKey | "")
              }
              className="rounded-sm border border-line px-3 py-2 text-sm text-ink"
            >
              {IMPORT_SYSTEM_FIELDS.map((f) => (
                <option key={f.label} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
