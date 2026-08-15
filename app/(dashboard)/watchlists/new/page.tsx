import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { createWatchlist } from "@/lib/actions/watchlists";

export default function NewWatchlistPage() {
  return (
    <div>
      <Link href="/watchlists" className="text-sm text-muted hover:underline">
        ← Zurück zu Watchlists
      </Link>
      <PageHeader
        title="Neue Watchlist"
        subtitle="Eigene Talent-Gruppierung anlegen"
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
            Name *
            <input
              type="text"
              name="name"
              placeholder="z. B. U17-Kader Sommer-Turnier"
              required
              className="field"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-ink">
            Beschreibung
            <input
              type="text"
              name="description"
              placeholder="z. B. Kandidaten für das Einladungsturnier im August"
              className="field"
            />
          </label>
        </div>
        <div className="mt-6">
          <Button type="submit">Watchlist anlegen</Button>
        </div>
      </form>
    </div>
  );
}
