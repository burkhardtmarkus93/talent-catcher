import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getWatchlists } from "@/lib/queries/watchlists";

export default async function WatchlistsPage() {
  const watchlists = await getWatchlists();

  return (
    <div>
      <PageHeader
        title="Watchlists"
        subtitle="Frei definierte Talent-Gruppierungen"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
          </svg>
        }
        action={
          <Link href="/watchlists/new">
            <Button>+ Neue Watchlist</Button>
          </Link>
        }
      />

      {watchlists.length === 0 ? (
        <p className="animate-fade-in-up text-sm text-muted">
          Noch keine Watchlist angelegt.
        </p>
      ) : (
        <ul className="animate-fade-in-up flex flex-col gap-2">
          {watchlists.map((w) => (
            <li key={w.id}>
              <Link
                href={`/watchlists/${w.id}`}
                className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-pitch hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-pitch-dim text-pitch-dark">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{w.name}</p>
                    {w.description && (
                      <p className="mt-0.5 text-xs text-muted">{w.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted">{w.talentCount} Talente</span>
                  <span className="text-sm text-pitch">Öffnen →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
