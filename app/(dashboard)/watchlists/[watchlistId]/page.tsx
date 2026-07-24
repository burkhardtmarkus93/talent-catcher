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
        action={<Button variant="secondary">+ Talent hinzufügen</Button>}
      />
      <TalentTable talents={talents} />
    </div>
  );
}
