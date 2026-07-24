import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { NewTalentForm } from "@/components/talents/NewTalentForm";

export default function NewTalentPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/talents" className="text-sm text-muted hover:underline">
        ← Zurück zur Talentliste
      </Link>
      <PageHeader
        title="Neues Talent anlegen"
        subtitle="Minderjährige Talente werden automatisch als nicht-öffentlich markiert"
      />
      <NewTalentForm />
    </div>
  );
}
