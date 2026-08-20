import { getTranslations } from "next-intl/server";
import { updatePassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { LogoLockup } from "@/components/ui/LogoLockup";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const t = await getTranslations("updatePassword");
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
          {searchParams.error ? (
            <div className="mt-4 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
              {searchParams.error}
            </div>
          ) : null}
        </div>
        <form action={updatePassword} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-ink">
            {t("newPassword")}
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="field"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-ink">
            {t("confirmPassword")}
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={8}
              className="field"
            />
          </label>
          <Button type="submit" className="mt-2 w-full">
            {t("submit")}
          </Button>
        </form>
      </div>
    </main>
  );
}
