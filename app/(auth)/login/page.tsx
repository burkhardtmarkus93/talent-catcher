import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { LogoLockup } from "@/components/ui/LogoLockup";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { signIn } from "@/lib/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const t = await getTranslations("login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-4">
      <div className="flex w-full max-w-sm justify-end">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <LogoLockup height={100} className="mb-2" />
          <p className="mt-1 text-sm text-muted">{t("tagline")}</p>
        </div>

        {searchParams.error ? (
          <div className="mb-4 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
            {searchParams.error}
          </div>
        ) : null}

        {searchParams.success ? (
          <div className="mb-4 rounded-lg border border-pitch/30 bg-pitch/5 px-3 py-2 text-sm text-pitch">
            {searchParams.success}
          </div>
        ) : null}

        <form action={signIn} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-ink">
            {t("email")}
            <input
              type="email"
              name="email"
              required
              placeholder={t("emailPlaceholder")}
              className="field"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm text-ink">
            {t("password")}
            <input
              type="password"
              name="password"
              required
              className="field"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              name="remember"
              className="rounded border-line"
            />
            {t("rememberMe")}
          </label>

          <Button type="submit" className="mt-2 w-full">
            {t("submit")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          <Link
            href="/reset-password"
            className="underline-offset-2 hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-muted">
          {t("noAccount")}{" "}
          <Link href="/signup" className="text-pitch underline-offset-2 hover:underline">
            {t("registerClub")}
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-muted">
          {t("playerQuestion")}{" "}
          <Link
            href="/player-registration"
            className="text-pitch underline-offset-2 hover:underline"
          >
            {t("playerRegister")}
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-muted">
          <Link href="/help" className="underline-offset-2 hover:underline">
            {t("helpLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}
