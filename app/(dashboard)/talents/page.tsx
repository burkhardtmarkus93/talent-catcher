import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function TalentsPage() {
  return (
    <div>
      <h1>Talente</h1>
      <Link href="/talents/new">
        <Button>+ Neues Talent</Button>
      </Link>
      <p>Minimaltest</p>
    </div>
  );
}
