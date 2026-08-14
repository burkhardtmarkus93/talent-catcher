"use client";

import { useRouter, useSearchParams } from "next/navigation";

type FilterBarProps = {
  q?: string;
  showArchived?: boolean;
  position?: string;
  status?: string;
  alert?: string;
  hiddenGem?: string;
};

export function FilterBar({
  q = "",
  showArchived = false,
  position = "Alle",
  status = "Alle",
  alert = "Alle",
  hiddenGem = "Alle",
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(next: Record<string, string | boolean>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (typeof value === "boolean") {
        if (value) params.set(key, "1");
        else params.delete(key);
        continue;
      }

      const trimmed = value.trim();
      if (trimmed && trimmed !== "Alle") params.set(key, trimmed);
      else params.delete(key);
    }

    const queryString = params.toString();
    router.push(queryString ? `/talents?${queryString}` : "/talents");
  }

  return (
    <div className="mb-4 rounded-sm border border-line bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-[260px] flex-1 items-center gap-2 text-sm text-muted">
          Suche
          <input
            type="text"
            defaultValue={q}
            placeholder="Name oder Verein"
            className="field"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParams({ q: e.currentTarget.value, showArchived });
              }
            }}
            onBlur={(e) => {
              updateParams({ q: e.currentTarget.value, showArchived });
            }}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) =>
              updateParams({ q, showArchived: e.currentTarget.checked })
            }
          />
          Archivierte Talente anzeigen
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        <Select
          label="Position"
          value={position}
          options={["Alle", "TW", "IV", "DM", "ST", "RM"]}
          onChange={(value) =>
            updateParams({ q, showArchived, position: value })
          }
        />
        <Select
          label="Status"
          value={status}
          options={["Alle", "In Beobachtung", "Empfehlung", "Abgeschlossen", "Verloren"]}
          onChange={(value) =>
            updateParams({ q, showArchived, status: value })
          }
        />
        <Select
          label="Ampel"
          value={alert}
          options={["Alle", "Rot", "Gelb", "Grün"]}
          onChange={(value) =>
            updateParams({ q, showArchived, alert: value })
          }
        />
        <Select
          label="Hidden Gem"
          value={hiddenGem}
          options={["Alle", "Nur Hidden Gems"]}
          onChange={(value) =>
            updateParams({ q, showArchived, hiddenGem: value })
          }
        />
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="select-field w-auto py-1"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
