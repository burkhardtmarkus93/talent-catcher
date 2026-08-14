import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LogoLockup } from "@/components/ui/LogoLockup";
import { requestPasswordReset } from "@/lib/actions/auth";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <LogoLockup height={90} className="mb-2" />
          <h1 className="font-display text-xl font-medium text-ink">
            Passwort zurücksetzen
          </h1>
          <p className="mt-1 text-sm text-muted">
            Gib deine E-Mail-Adresse ein, um einen Reset-Link zu erhalten.
          </p>

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
            E-Mail
            <input
              type="email"
              name="email"
              required
              placeholder="scout@verein.de"
              className="field"
            />
          </label>

          <Button type="submit" className="w-full">
            Reset-Link anfordern
          </Button>
        </form>

        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-lg border border-line px-3 py-2 text-sm text-ink transition hover:bg-paper"
          >
            Zurück zum Login
          </Link>
        </div>
      </div>
    </main>
  );
}