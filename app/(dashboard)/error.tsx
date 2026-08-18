"use client";

import { useTranslations } from "next-intl";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("dashboardError");
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <p className="font-display text-lg text-ink">
        {t("title")}
      </p>
      <p className="max-w-sm text-sm text-muted">
        {error.message || t("fallbackMessage")}
      </p>
      <button
        onClick={reset}
        className="rounded-lg border border-line px-4 py-2 text-sm text-ink hover:bg-pitch-dim"
      >
        {t("retry")}
      </button>
    </div>
  );
}
