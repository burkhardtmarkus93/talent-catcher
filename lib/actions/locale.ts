"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { locales, type Locale } from "@/i18n/config";

export async function setLocale(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "");

  if (!(locales as readonly string[]).includes(locale)) {
    throw new Error("Ungültige Sprache.");
  }

  // 1 Jahr — reine UI-Präferenz, kein Auth-/Sessioncookie, deshalb
  // bewusst lang und ohne httpOnly (falls später auch clientseitig
  // gelesen werden soll, z. B. für Datumsformatierung).
  cookies().set("NEXT_LOCALE", locale as Locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
