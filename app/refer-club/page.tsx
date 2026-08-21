import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LogoLockup } from "@/components/ui/LogoLockup";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ClubReferralForm } from "@/components/candidates/ClubReferralForm";

export default async function ReferClubPage() {
  const t = await getTranslations("clubReferralPage");

  return (
    <main className="flex min-h-screen flex-col items-center gap-3 bg-paper px-4 py-12">
      <div className="flex w-full max-w-lg justify-end">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-lg rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <LogoLockup height={90} className="mb-2" />
          <h1 className="font-display text-xl font-medium text-ink">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("tagline")}</p>
        </div>

        <ClubReferralForm />

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/player-registration" className="underline-offset-2 hover:underline">
            {t("backToRegistration")}
          </Link>
        </p>
      </div>
    </main>
  );
}
