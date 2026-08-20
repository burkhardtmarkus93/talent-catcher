import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { LogoLockup } from "@/components/ui/LogoLockup";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { PlanSelector } from "@/components/auth/PlanSelector";
import { signUp } from "@/lib/actions/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const t = await getTranslations("signup");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-4 py-12">
      <div className="flex w-full max-w-3xl justify-end">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-3xl rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <LogoLockup height={90} className="mb-2" />
          <h1 className="font-display text-xl font-medium text-ink">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("tagline")}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-pitch-dim px-3 py-1 text-xs font-semibold text-pitch-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
            {t("trialBadge")}
          </p>
        </div>

        {searchParams.error ? (
          <div className="mb-6 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
            {searchParams.error}
          </div>
        ) : null}

        <form action={signUp} className="flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm text-ink">
              {t("clubName")}
              <input
                type="text"
                name="clubName"
                required
                placeholder="FC Beispiel"
                className="field"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-ink">
              {t("email")}
              <input
                type="email"
                name="email"
                required
                placeholder="scout@verein.de"
                className="field"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-ink sm:col-span-2">
              {t("password")}
              <input
                type="password"
                name="password"
                required
                minLength={8}
                placeholder={t("passwordPlaceholder")}
                className="field"
              />
            </label>
          </div>

          <div>
            <p className="mb-1 text-center text-sm font-medium text-ink">
              {t("planHeading")}
            </p>
            <p className="mb-4 text-center text-xs text-muted">
              {t("planSubheading")}
            </p>
            <PlanSelector />
          </div>

          <Button type="submit" className="w-full">
            {t("submit")}
          </Button>

          <p className="text-center text-xs text-muted">{t("legalNote")}</p>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {t("alreadyHaveAccount")}{" "}
          <Link href="/login" className="text-pitch underline-offset-2 hover:underline">
            {t("signIn")}
          </Link>
        </p>
      </div>
    </main>
  );
}
