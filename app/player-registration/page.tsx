import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LogoLockup } from "@/components/ui/LogoLockup";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { CandidateRegistrationForm } from "@/components/candidates/CandidateRegistrationForm";
import { getPublicClubOptions } from "@/lib/queries/candidates";

export default async function PlayerRegistrationPage() {
  const [t, clubs] = await Promise.all([
    getTranslations("candidateRegistrationPage"),
    getPublicClubOptions(),
  ]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-4 py-12">
      <div className="flex w-full max-w-lg justify-end">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-lg rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <LogoLockup height={90} className="mb-2" />
          <h1 className="font-display text-xl font-medium text-ink">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("tagline")}</p>
        </div>

        <CandidateRegistrationForm clubs={clubs} />

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="underline-offset-2 hover:underline">
            {t("backToLogin")}
          </Link>
          {" · "}
          <Link href="/help" className="underline-offset-2 hover:underline">
            {t("helpLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}
