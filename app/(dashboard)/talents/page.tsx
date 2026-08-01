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
  searchParams?: { q?: string; showArchived?: string };
}) {
  const q = searchParams?.q?.trim() ?? "";
  const showArchived = searchParams?.showArchived === "1";

  const [talents, appUser] = await Promise.all([
    getTalents({ q, showArchived }),
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
      <FilterBar q={q} showArchived={showArchived} />
      <TalentTable
        talents={talents}
        currentUserHasYouthAccess={appUser?.hasYouthAccess ?? false}
      />
    </div>
  );
}
