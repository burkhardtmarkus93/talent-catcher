import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { getTalents } from "@/lib/queries/talents";
import { getCurrentAppUser } from "@/lib/queries/session";

export default async function TalentsPage() {
  const [talents, appUser] = await Promise.all([
    getTalents(),
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
      <p>Talente geladen: {talents.length}</p>
      <p>User: {appUser?.email ?? "kein User"}</p>
    </div>
  );
}
