import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LogoLockup } from "@/components/ui/LogoLockup";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { CandidateRegistrationForm } from "@/components/candidates/CandidateRegistrationForm";
import { getPublicClubOptions } from "@/lib/queries/candidates";

export default async function PlayerRegistrationPage({
  searchParams,
}: {
  searchParams?: { paid?: string; canceled?: string };
}) {
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

        {searchParams?.paid === "1" ? (
          <div className="rounded-xl border border-pitch/30 bg-pitch/5 p-6 text-sm text-pitch-dark">
            <p className="font-medium">{t("paidSuccessTitle")}</p>
            <p className="mt-1.5 text-pitch-dark/80">{t("paidSuccessBody")}</p>
          </div>
        ) : (
          <>
            {searchParams?.canceled === "1" && (
              <div className="mb-4 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-muted">
                {t("paymentCanceled")}
              </div>
            )}
            <CandidateRegistrationForm clubs={clubs} />
          </>
        )}

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
