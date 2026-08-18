import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { getTalentById } from "@/lib/queries/talents";
import { getKoordinationstestDocUrl } from "@/lib/queries/documents";
import { createGkCoordinationTest } from "@/lib/actions/gkTests";

const TEST_KEYS = [
  "scoreWechselwurf",
  "scoreKreuzprellen",
  "scoreWandreaktion",
  "scoreDoppelwandwurf",
  "scoreWurfdrehung",
  "scoreDoppeldrehung",
] as const;

export default async function GKTestNewPage({
  params,
  searchParams,
}: {
  params: { talentId: string };
  searchParams: { error?: string };
}) {
  const talent = await getTalentById(params.talentId);
  if (!talent) notFound();

  const docUrl = await getKoordinationstestDocUrl();
  const today = new Date().toISOString().slice(0, 10);
  const t = await getTranslations("gkTest");

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/talents/${talent.id}`}
        className="text-sm text-muted hover:underline"
      >
        {t("backTo", { name: `${talent.firstName} ${talent.lastName}` })}
      </Link>

      <h1 className="mt-2 font-display text-2xl font-medium text-ink">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>

      {searchParams.error && (
        <div className="mt-4 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
          {decodeURIComponent(searchParams.error)}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-line bg-pitch-dim p-4 text-sm text-ink">
        <div className="font-medium">{t("scoreLegendTitle")}</div>
        <div className="mt-1 text-muted">
          <span className="font-medium text-ink">0</span> = {t("score0")}
          <br />
          <span className="font-medium text-ink">1</span> = {t("score1")}
          <br />
          <span className="font-medium text-ink">2</span> = {t("score2")}
          <br />
          <span className="font-medium text-ink">3</span> = {t("score3")}
        </div>
      </div>

      {docUrl && (
        <div className="mt-6">
          <a href={docUrl} target="_blank" rel="noreferrer">
            <Button variant="secondary">{t("downloadDoc")}</Button>
          </a>
          <p className="mt-2 text-xs text-muted">{t("downloadDocHint")}</p>
        </div>
      )}

      <form
        action={createGkCoordinationTest}
        className="mt-6 flex flex-col gap-5 rounded-xl border border-line bg-surface p-5"
      >
        <input type="hidden" name="talentId" value={talent.id} />
        <label className="flex flex-col gap-1.5 text-sm text-ink">
          {t("testDate")}
          <input
            type="date"
            name="testDate"
            defaultValue={today}
            required
            className="field"
          />
        </label>

        {TEST_KEYS.map((key) => (
          <label key={key} className="flex flex-col gap-1.5 text-sm text-ink">
            {t(`tests.${key}`)}{" "}
            <span className="font-normal text-muted">{t("pointsRange")}</span>
            <input
              type="number"
              name={key}
              min={0}
              max={3}
              step={1}
              inputMode="numeric"
              placeholder={t("pointsPlaceholder")}
              className="field"
            />
          </label>
        ))}

        <Button type="submit">{t("save")}</Button>
      </form>
    </div>
  );
}
