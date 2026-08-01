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
      <TalentTable
        talents={talents}
        currentUserHasYouthAccess={appUser?.hasYouthAccess ?? false}
      />
    </div>
  );
}
