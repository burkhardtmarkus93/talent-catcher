import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/talents/FilterBar";
import { TalentTable } from "@/components/talents/TalentTable";
import { getCurrentAppUser } from "@/lib/queries/session";
import { getTalents } from "@/lib/queries/talents";

// Filter/Sortierung sind weiterhin UI-Vorbereitung (siehe FilterBar) —
// die tatsächliche Filterung über `searchParams` ist nicht Teil dieser
// Runde und bleibt bewusst unverändert, um keinen Scope aufzumachen.
export default async function TalentsPage() {
  const talents = await getTalents();
  const appUser = await getCurrentAppUser();

  return (
    <div>
      <PageHeader
        title="Talente"
        subtitle={`${talents.length} Talente im Talentpool`}
        action={
          <Link href="/talents/new">
            <Button>+ Neues Talent</Button>
          </Link>
        }
      />
      <FilterBar />
      {talents.length === 0 ? (
        <p className="rounded-sm border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
          Noch keine Talente angelegt.
        </p>
      ) : (
        <TalentTable
  talents={talents}
  currentUserHasYouthAccess={appUser?.hasYouthAccess ?? false}
/>
      )}
    </div>
  );
}
