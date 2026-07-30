import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getCurrentAppUser } from "@/lib/queries/users";

export default async function TalentsPage() {
  const appUser = await getCurrentAppUser();

  return (
    <div>
      <h1>Talente</h1>
      <Link href="/talents/new">
        <Button>+ Neues Talent</Button>
      </Link>
      <p>Minimaltest</p>
      <p>Eingeloggt als: {appUser?.name ?? "Unbekannt"}</p>
    </div>
  );
}
