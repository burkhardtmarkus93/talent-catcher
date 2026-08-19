import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { createWatchlist } from "@/lib/actions/watchlists";

export default async function NewWatchlistPage() {
  const t = await getTranslations("newWatchlistPage");
  return (
    <div>
      <Link href="/watchlists" className="text-sm text-muted hover:underline">
        {t("backToWatchlists")}
      </Link>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
          </svg>
        }
      />

      <form
        action={createWatchlist}
        className="max-w-lg rounded-xl border border-line bg-surface p-5"
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-ink">
            {t("name")}
            <input
              type="text"
              name="name"
              placeholder={t("namePlaceholder")}
              required
              className="field"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-ink">
            {t("description")}
            <input
              type="text"
              name="description"
              placeholder={t("descriptionPlaceholder")}
              className="field"
            />
          </label>
        </div>
        <div className="mt-6">
          <Button type="submit">{t("submit")}</Button>
        </div>
      </form>
    </div>
  );
}
