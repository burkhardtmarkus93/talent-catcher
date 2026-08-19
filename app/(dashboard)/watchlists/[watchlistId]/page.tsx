import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { TalentTable } from "@/components/talents/TalentTable";
import { getWatchlistById, getTalentsForWatchlist } from "@/lib/queries/watchlists";
import { getTalents } from "@/lib/queries/talents";
import { getCurrentAppUser } from "@/lib/queries/session";
import { addTalentToWatchlist, removeTalentFromWatchlist } from "@/lib/actions/watchlists";

export default async function WatchlistDetailPage({
  params,
}: {
  params: { watchlistId: string };
}) {
  const watchlist = await getWatchlistById(params.watchlistId);
  if (!watchlist) notFound();

  const [talents, allTalents, appUser] = await Promise.all([
    getTalentsForWatchlist(watchlist.id),
    getTalents(),
    getCurrentAppUser(),
  ]);

  const talentIdsInList = new Set(talents.map((t) => t.id));
  const availableTalents = allTalents.filter((t) => !talentIdsInList.has(t.id));
  const t = await getTranslations("watchlistDetailPage");

  return (
    <div>
      <Link href="/watchlists" className="text-sm text-muted hover:underline">
        {t("backToWatchlists")}
      </Link>
      <PageHeader
        title={watchlist.name}
        subtitle={watchlist.description ?? undefined}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
          </svg>
        }
      />

      <form
        action={addTalentToWatchlist}
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4"
      >
        <input type="hidden" name="watchlistId" value={watchlist.id} />
        <label className="flex min-w-[240px] flex-1 flex-col gap-1.5 text-sm text-ink">
          {t("addTalent")}
          <select name="talentId" required defaultValue="" className="select-field">
            <option value="" disabled>
              {availableTalents.length === 0
                ? t("noneAvailable")
                : t("selectTalent")}
            </option>
            {availableTalents.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.firstName} {opt.lastName} · {opt.primaryPosition}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="secondary" disabled={availableTalents.length === 0}>
          {t("addTalentButton")}
        </Button>
      </form>

      {talents.length === 0 ? (
        <p className="animate-fade-in-up text-sm text-muted">
          {t("empty")}
        </p>
      ) : (
        <div className="animate-fade-in-up">
          <TalentTable
            talents={talents}
            currentUserHasYouthAccess={appUser?.hasYouthAccess ?? false}
            renderActions={(talent) => (
              <form action={removeTalentFromWatchlist}>
                <input type="hidden" name="watchlistId" value={watchlist.id} />
                <input type="hidden" name="talentId" value={talent.id} />
                <button type="submit" className="text-sm text-muted hover:text-brick">
                  {t("remove")}
                </button>
              </form>
            )}
          />
        </div>
      )}
    </div>
  );
}
