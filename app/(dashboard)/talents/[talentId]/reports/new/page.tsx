import Link from "next/link";
import { notFound } from "next/navigation";
import { getTalentById } from "@/lib/queries/talents";
import { ScoutReportForm } from "@/components/reports/ScoutReportForm";

export default async function NewScoutReportPage({
  params,
  searchParams,
}: {
  params: { talentId: string };
  searchParams: { reminderId?: string };
}) {
  const talent = await getTalentById(params.talentId);
  if (!talent) notFound();

  const fullName = `${talent.firstName} ${talent.lastName}`;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/talents/${talent.id}`}
        className="text-sm text-muted hover:underline"
      >
        ← Zurück zur Talentakte
      </Link>
      <h1 className="mb-6 mt-2 font-display text-2xl font-medium text-ink">
        Neuer Bericht — {fullName}{" "}
        <span className="text-base font-normal text-muted">
          ({talent.primaryPosition})
        </span>
      </h1>
      <ScoutReportForm talentId={talent.id} reminderId={searchParams.reminderId} />
    </div>
  );
}
