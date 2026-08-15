import type { ReactNode } from "react";

// Native <details>/<summary> statt einer JS-Akkordeon-Lösung — kein neuer
// State, keine neue Abhängigkeit, funktioniert auch ohne JS. Tailwinds
// group-open-Variante deckt den Pfeil-Dreh-Effekt ab.
export function CollapsibleSection({
  title,
  meta,
  defaultOpen = false,
  children,
}: {
  title: string;
  meta?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group mt-6 rounded-xl border border-line bg-surface p-5"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="font-display text-lg font-medium text-ink">{title}</span>
        <span className="flex items-center gap-2">
          {meta && <span className="text-xs text-muted">{meta}</span>}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-none text-muted transition-transform duration-200 group-open:rotate-180"
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}
