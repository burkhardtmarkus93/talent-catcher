import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { archiveTalent } from "@/lib/actions/talents";

export async function InactivityBanner({
  talentId,
  lastActivityAt,
}: {
  talentId: string;
  lastActivityAt: Date;
}) {
  const locale = await getLocale();
  const t = await getTranslations("inactivityBanner");
  const formattedDate = lastActivityAt.toLocaleDateString(locale);

  return (
    <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-3">
      <p className="text-sm text-amber-800">
        {t("message", { date: formattedDate })}
      </p>
      <div className="mt-2 flex gap-2">
        <form action={archiveTalent}>
          <input type="hidden" name="talentId" value={talentId} />
          <button
            type="submit"
            className="rounded-lg border border-amber-600 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            {t("archive")}
          </button>
        </form>
        <Link
          href={`#reminder-form`}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink hover:bg-paper"
        >
          {t("followUpAgain")}
        </Link>
      </div>
    </div>
  );
}
