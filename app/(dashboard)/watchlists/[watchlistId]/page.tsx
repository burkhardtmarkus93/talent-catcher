import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { TalentTable } from "@/components/talents/TalentTable";
import { dummyWatchlists, dummyTalents } from "@/lib/dummy-data";

export default function WatchlistDetailPage({
  params,
}: {
  params: { watchlistId: string };
}) {
  const watchlist = dummyWatchlists.find((w) => w.id === params.watchlistId);
  if (!watchlist) notFound();

  // Demo-Zuordnung: in dieser Dummy-Version zeigen wir eine Teilmenge der
  // Talente. Live wird dies über `watchlist_talents` gejoint.
  const talents = dummyTalents.slice(0, 3);

  return (
    <div>
      <Link href="/watchlists" className="text-sm text-muted hover:underline">
        ← Zurück zu Watchlists
      </Link>
      <PageHeader
        title={watchlist.name}
        subtitle={watchlist.description ?? undefined}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
          </svg>
        }
        action={<Button variant="secondary">+ Talent hinzufügen</Button>}
      />
      <div className="animate-fade-in-up">
        <TalentTable talents={talents} currentUserHasYouthAccess={false} />
      </div>
    </div>
  );
}
