import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar } from "@/components/talents/FilterBar";
import { TalentTable } from "@/components/talents/TalentTable";
import { getTalents } from "@/lib/queries/talents";
import { getCurrentAppUser } from "@/lib/queries/session";

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
  };
}) {
  const filters = {
    q: searchParams?.q ?? "",
    showArchived: searchParams?.showArchived === "1",
    position: searchParams?.position ?? "Alle",
    status: searchParams?.status ?? "Alle",
    alert: searchParams?.alert ?? "Alle",
    hiddenGem: searchParams?.hiddenGem ?? "Alle",
  };

  const [talents, appUser] = await Promise.all([
    getTalents(filters),
    getCurrentAppUser(),
  ]);

  return (
    <div>
      <PageHeader
        title="Talente"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
        action={
          <Link href="/talents/new">
            <Button>+ Neues Talent</Button>
          </Link>
        }
      />
      <FilterBar
        q={filters.q}
        showArchived={filters.showArchived}
        position={filters.position}
        status={filters.status}
        alert={filters.alert}
        hiddenGem={filters.hiddenGem}
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
