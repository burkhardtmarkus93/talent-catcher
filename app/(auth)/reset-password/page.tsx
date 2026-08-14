import Link from "next/link";
import { Button } from "@/components/ui/Button";
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
          <h1 className="font-display text-2xl font-medium text-ink">
            Passwort zurücksetzen
          </h1>
          <p className="mt-1 text-sm text-muted">
            Gib deine E-Mail-Adresse ein, um einen Reset-Link zu erhalten.
          </p>

          {searchParams.error ? (
            <p className="mt-4 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
              {searchParams.error}
            </p>
          ) : null}

          {searchParams.success ? (
            <p className="mt-4 rounded-lg border border-green-600/30 bg-green-600/10 px-3 py-2 text-sm text-green-700">
              {searchParams.success}
            </p>
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