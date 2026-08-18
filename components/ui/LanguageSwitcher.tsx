"use client";

import { useLocale, useTranslations } from "next-intl";
import { setLocale } from "@/lib/actions/locale";
import { locales, localeLabels } from "@/i18n/config";

// Kein next-intl-URL-Routing (siehe i18n/request.ts) — die Umschaltung
// setzt nur das NEXT_LOCALE-Cookie und lädt die aktuelle Seite neu,
// keine Navigation zu einer anderen URL.
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("languageSwitcher");

  return (
    <form action={setLocale} className={className}>
      <label className="sr-only" htmlFor="locale-switcher">
        {t("label")}
      </label>
      <select
        id="locale-switcher"
        name="locale"
        defaultValue={locale}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="select-field w-auto py-1 text-xs"
        aria-label={t("label")}
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeLabels[l]}
          </option>
        ))}
      </select>
    </form>
  );
}
