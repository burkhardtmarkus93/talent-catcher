"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <p className="font-display text-lg text-ink">
        Diese Seite konnte nicht geladen werden.
      </p>
      <p className="max-w-sm text-sm text-muted">
        {error.message || "Es ist ein unerwarteter Fehler aufgetreten."}
      </p>
      <button
        onClick={reset}
        className="rounded-sm border border-line px-4 py-2 text-sm text-ink hover:bg-pitch-dim"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
