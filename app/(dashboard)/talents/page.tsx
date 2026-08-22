import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar } from "@/components/talents/FilterBar";
import { TalentTable } from "@/components/talents/TalentTable";
import { getTalents } from "@/lib/queries/talents";
import { getCurrentAppUser } from "@/lib/queries/session";

// Nur die Filter-relevanten Felder werden an den CSV-Export
// weitergereicht (dieselben Keys/Defaults wie `filters` unten) — der
// Export soll exakt dieselbe, bereits gefilterte Liste widerspiegeln,
// die gerade sichtbar ist, statt einen eigenen ungefilterten Datensatz.
function buildExportQuery(filters: Record<string, string | boolean>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === "boolean") {
      if (value) params.set(key, "1");
    } else if (value && value !== "alle") {
      params.set(key, value);
    }
  }
  return params.toString();
}

export default async function TalentsPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    showArchived?: string;
    position?: string;
    status?: string;
    alert?: string;
    hiddenGem?: string;
    dfbStuetzpunkt?: string;
    verbandsauswahl?: string;
    nationalmannschaft?: string;
    nlz?: string;
    euPassport?: string;
    perspektivkader?: string;
  };
}) {
  const filters = {
    q: searchParams?.q ?? "",
    showArchived: searchParams?.showArchived === "1",
    position: searchParams?.position ?? "alle",
    status: searchParams?.status ?? "alle",
    alert: searchParams?.alert ?? "alle",
    hiddenGem: searchParams?.hiddenGem ?? "alle",
    dfbStuetzpunkt: searchParams?.dfbStuetzpunkt ?? "alle",
    verbandsauswahl: searchParams?.verbandsauswahl ?? "alle",
    nationalmannschaft: searchParams?.nationalmannschaft ?? "alle",
    nlz: searchParams?.nlz ?? "alle",
    euPassport: searchParams?.euPassport ?? "alle",
    perspektivkader: searchParams?.perspektivkader ?? "alle",
  };

  const [talents, appUser, t] = await Promise.all([
    getTalents(filters),
    getCurrentAppUser(),
    getTranslations("talentsPage"),
  ]);

  return (
    <div>
      <PageHeader
        title={t("title")}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
        action={
          <div className="flex items-center gap-2">
            <a href={`/api/talents/export?${buildExportQuery(filters)}`}>
              <Button variant="secondary">{t("exportCsv")}</Button>
            </a>
            <Link href="/talents/new">
              <Button>{t("newTalent")}</Button>
            </Link>
          </div>
        }
      />
      <FilterBar
        q={filters.q}
        showArchived={filters.showArchived}
        position={filters.position}
        status={filters.status}
        alert={filters.alert}
        hiddenGem={filters.hiddenGem}
        dfbStuetzpunkt={filters.dfbStuetzpunkt}
        verbandsauswahl={filters.verbandsauswahl}
        nationalmannschaft={filters.nationalmannschaft}
        nlz={filters.nlz}
        euPassport={filters.euPassport}
        perspektivkader={filters.perspektivkader}
      />
      <div className="animate-fade-in-up">
        <TalentTable
          talents={talents}
          currentUserHasYouthAccess={appUser?.hasYouthAccess ?? false}
        />
      </div>
    </div>
  );
}
