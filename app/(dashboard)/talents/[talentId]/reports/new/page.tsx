import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("newReportPage");

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/talents/${talent.id}`}
        className="text-sm text-muted hover:underline"
      >
        {t("backToFile")}
      </Link>
      <h1 className="mb-6 mt-2 font-display text-2xl font-medium text-ink">
        {t("heading", { name: fullName })}{" "}
        <span className="text-base font-normal text-muted">
          ({talent.primaryPosition})
        </span>
      </h1>
      <ScoutReportForm talentId={talent.id} reminderId={searchParams.reminderId} />
    </div>
  );
}
