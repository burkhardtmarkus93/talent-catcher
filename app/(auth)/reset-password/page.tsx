import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { LogoLockup } from "@/components/ui/LogoLockup";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { requestPasswordReset } from "@/lib/actions/auth";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const t = await getTranslations("resetPassword");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-4">
      <div className="flex w-full max-w-sm justify-end">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <LogoLockup height={90} className="mb-2" />
          <h1 className="font-display text-xl font-medium text-ink">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("tagline")}</p>

          {searchParams.error ? (
            <div className="mt-4 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
              {searchParams.error}
            </div>
          ) : null}

          {searchParams.success ? (
            <div className="mt-4 rounded-lg border border-pitch/30 bg-pitch/5 px-3 py-2 text-sm text-pitch">
              {searchParams.success}
            </div>
          ) : null}
        </div>

        <form action={requestPasswordReset} className="flex flex-col gap-4">
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

          <Button type="submit" className="w-full">
            {t("submit")}
          </Button>
        </form>

        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-lg border border-line px-3 py-2 text-sm text-ink transition hover:bg-paper"
          >
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    </main>
  );
}
