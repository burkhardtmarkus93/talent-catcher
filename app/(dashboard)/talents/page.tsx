import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";

export default function TalentsPage() {
  return (
    <div>
      <PageHeader
        title="Talente"
        actions={
          <Link href="/talents/new">
            <Button>+ Neues Talent</Button>
          </Link>
        }
      />
      <p>Minimaltest</p>
    </div>
  );
}
