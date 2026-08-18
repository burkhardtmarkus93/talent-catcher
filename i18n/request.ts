import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { locales, defaultLocale, type Locale } from "./config";

// Bewusst OHNE next-intls URL-Routing (kein /en/..., /es/...-Präfix vor
// jeder bestehenden Route) — das hätte bedeutet, jede vorhandene Route
// unter app/[locale]/... zu verschieben, ein sehr invasiver Umbau der
// gesamten Ordnerstruktur für eine Sprachumschaltung. Stattdessen: ein
// Cookie (siehe lib/actions/locale.ts) plus Accept-Language-Fallback für
// Erstbesucher, gelesen serverseitig bei jedem Request.
export function resolveLocale(): Locale {
  const cookieLocale = cookies().get("NEXT_LOCALE")?.value;
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as Locale;
  }

  const acceptLanguage = headers().get("accept-language");
  if (acceptLanguage) {
    for (const candidate of acceptLanguage.split(",")) {
      const code = candidate.trim().split(";")[0].split("-")[0].toLowerCase();
      if ((locales as readonly string[]).includes(code)) {
        return code as Locale;
      }
    }
  }

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = resolveLocale();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
