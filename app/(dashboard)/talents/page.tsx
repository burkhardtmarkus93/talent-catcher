import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar } from "@/components/talents/FilterBar";
import { getTalents } from "@/lib/queries/talents";

export default async function TalentsPage() {
  const talents = await getTalents();

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
      <FilterBar />
      <p>Talente geladen: {talents.length}</p>
      <pre>{JSON.stringify(talents[0] ?? null, null, 2)}</pre>
    </div>
  );
}
