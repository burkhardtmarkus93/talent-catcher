// Reine Konstanten, bewusst ohne next/headers-Import — diese Datei darf
// sowohl von Server- als auch Client-Komponenten importiert werden
// (z. B. components/ui/LanguageSwitcher.tsx). Die server-only-Logik
// (Cookie-/Header-Auswertung) liegt in i18n/request.ts.
export const locales = ["de", "en", "es", "pt", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "de";

export const localeLabels: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  es: "Español",
  pt: "Português",
  fr: "Français",
};
