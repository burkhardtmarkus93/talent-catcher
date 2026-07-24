import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { dummyWatchlists } from "@/lib/dummy-data";

export default function WatchlistsPage() {
  return (
    <div>
      <PageHeader
        title="Watchlists"
        subtitle="Frei definierte Talent-Gruppierungen"
        action={<Button>+ Neue Watchlist</Button>}
      />

      <input
        type="search"
        placeholder="Watchlists durchsuchen..."
        className="mb-4 w-full max-w-sm rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-pitch"
      />

      <ul className="divide-y divide-line rounded-sm border border-line bg-surface">
        {dummyWatchlists.map((w) => (
          <li key={w.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <Link
                href={`/watchlists/${w.id}`}
                className="text-sm font-medium text-ink hover:underline"
              >
                {w.name}
              </Link>
              {w.description && (
                <p className="mt-0.5 text-xs text-muted">{w.description}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted">{w.talentCount} Talente</span>
              <Link href={`/watchlists/${w.id}`}>
                <Button variant="secondary">Öffnen</Button>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
