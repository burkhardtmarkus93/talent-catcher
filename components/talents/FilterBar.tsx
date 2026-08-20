"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

type FilterBarProps = {
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
};

export function FilterBar({
  q = "",
  showArchived = false,
  position = "alle",
  status = "alle",
  alert = "alle",
  hiddenGem = "alle",
  dfbStuetzpunkt = "alle",
  verbandsauswahl = "alle",
  nationalmannschaft = "alle",
  nlz = "alle",
  euPassport = "alle",
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("filterBar");

  function updateParams(next: Record<string, string | boolean>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (typeof value === "boolean") {
        if (value) params.set(key, "1");
        else params.delete(key);
        continue;
      }

      const trimmed = value.trim();
      if (trimmed && trimmed !== "alle") params.set(key, trimmed);
      else params.delete(key);
    }

    const queryString = params.toString();
    router.push(queryString ? `/talents?${queryString}` : "/talents");
  }

  const yesNoOptions = [
    { value: "alle", label: t("all") },
    { value: "true", label: t("yes") },
    { value: "false", label: t("no") },
  ];

  return (
    <div
      className="mb-4 rounded-lg border border-line bg-surface px-4 py-3"
      data-tour-id="tour-talents-filters"
    >
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-[260px] flex-1 items-center gap-2 text-sm text-muted">
          {t("search")}
          <input
            type="text"
            defaultValue={q}
            placeholder={t("searchPlaceholder")}
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
          {t("showArchived")}
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        <Select
          label={t("position")}
          value={position}
          options={[
            { value: "alle", label: t("all") },
            { value: "TW", label: "TW" },
            { value: "IV", label: "IV" },
            { value: "DM", label: "DM" },
            { value: "ST", label: "ST" },
            { value: "RM", label: "RM" },
          ]}
          onChange={(value) =>
            updateParams({ q, showArchived, position: value })
          }
        />
        <Select
          label={t("status")}
          value={status}
          options={[
            { value: "alle", label: t("all") },
            { value: "in_beobachtung", label: t("statusInBeobachtung") },
            { value: "empfehlung", label: t("statusEmpfehlung") },
            { value: "abgeschlossen", label: t("statusAbgeschlossen") },
            { value: "verloren", label: t("statusVerloren") },
          ]}
          onChange={(value) =>
            updateParams({ q, showArchived, status: value })
          }
        />
        <Select
          label={t("alertLabel")}
          value={alert}
          options={[
            { value: "alle", label: t("all") },
            { value: "rot", label: t("alertRot") },
            { value: "gelb", label: t("alertGelb") },
            { value: "gruen", label: t("alertGruen") },
          ]}
          onChange={(value) =>
            updateParams({ q, showArchived, alert: value })
          }
        />
        <Select
          label={t("hiddenGem")}
          value={hiddenGem}
          options={[
            { value: "alle", label: t("all") },
            { value: "only", label: t("onlyHiddenGems") },
          ]}
          onChange={(value) =>
            updateParams({ q, showArchived, hiddenGem: value })
          }
        />
        <Select
          label={t("dfbStuetzpunkt")}
          value={dfbStuetzpunkt}
          options={yesNoOptions}
          onChange={(value) =>
            updateParams({ q, showArchived, dfbStuetzpunkt: value })
          }
        />
        <Select
          label={t("verbandsauswahl")}
          value={verbandsauswahl}
          options={yesNoOptions}
          onChange={(value) =>
            updateParams({ q, showArchived, verbandsauswahl: value })
          }
        />
        <Select
          label={t("nationalmannschaft")}
          value={nationalmannschaft}
          options={yesNoOptions}
          onChange={(value) =>
            updateParams({ q, showArchived, nationalmannschaft: value })
          }
        />
        <Select
          label={t("nlz")}
          value={nlz}
          options={yesNoOptions}
          onChange={(value) => updateParams({ q, showArchived, nlz: value })}
        />
        <Select
          label={t("euPassport")}
          value={euPassport}
          options={yesNoOptions}
          onChange={(value) =>
            updateParams({ q, showArchived, euPassport: value })
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
  options: { value: string; label: string }[];
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
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
