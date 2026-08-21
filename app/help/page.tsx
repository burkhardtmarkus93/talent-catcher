import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LogoLockup } from "@/components/ui/LogoLockup";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

const CONTACT_EMAIL = "burkhardt.markus93@gmail.com";

export default async function HelpPage() {
  const t = await getTranslations("helpPage");
  const faqItems = t.raw("faq") as { q: string; a: string }[];

  return (
    <main className="flex min-h-screen flex-col items-center gap-3 bg-paper px-4 py-12">
      <div className="flex w-full max-w-2xl justify-end">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-2xl rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <LogoLockup height={90} className="mb-2" />
          <h1 className="font-display text-xl font-medium text-ink">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("tagline")}</p>
        </div>

        <h2 className="mb-3 font-display text-base font-medium text-ink">{t("faqHeading")}</h2>
        <div className="mb-8 flex flex-col gap-2">
          {faqItems.map((item, index) => (
            <details
              key={index}
              className="group rounded-lg border border-line bg-paper px-4 py-3"
            >
              <summary className="cursor-pointer list-none text-sm font-medium text-ink marker:content-none">
                {item.q}
              </summary>
              <p className="mt-2 text-sm text-muted">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="rounded-lg border border-line bg-paper p-4">
          <h2 className="mb-1 font-display text-base font-medium text-ink">
            {t("contactHeading")}
          </h2>
          <p className="mb-3 text-sm text-muted">{t("contactBody")}</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center rounded-lg bg-pitch px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-pitch-dark"
          >
            {t("contactButton")}
          </a>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="underline-offset-2 hover:underline">
            {t("backToLogin")}
          </Link>
          {" · "}
          <Link href="/impressum" className="underline-offset-2 hover:underline">
            {t("impressumLink")}
          </Link>
          {" · "}
          <Link href="/datenschutz" className="underline-offset-2 hover:underline">
            {t("privacyLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}
