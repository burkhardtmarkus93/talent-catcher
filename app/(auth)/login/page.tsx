import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LogoLockup } from "@/components/ui/LogoLockup";
import { signIn } from "@/lib/actions/auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <LogoLockup height={100} className="mb-2" />
          <p className="mt-1 text-sm text-muted">
            Anmelden, um mit dem Scouting fortzufahren
          </p>
        </div>

        {searchParams.error ? (
          <div className="mb-4 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
            {searchParams.error}
          </div>
        ) : null}

        {searchParams.success ? (
          <div className="mb-4 rounded-lg border border-green-600/30 bg-green-600/10 px-3 py-2 text-sm text-green-700">
            {searchParams.success}
          </div>
        ) : null}

        <form action={signIn} className="flex flex-col gap-4">
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

          <label className="flex flex-col gap-1.5 text-sm text-ink">
            Passwort
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
            Angemeldet bleiben
          </label>

          <Button type="submit" className="mt-2 w-full">
            Anmelden
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          <Link
            href="/reset-password"
            className="underline-offset-2 hover:underline"
          >
            Passwort vergessen?
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-muted">
          Noch kein Konto?{" "}
          <Link href="/signup" className="text-pitch underline-offset-2 hover:underline">
            Verein registrieren
          </Link>
        </p>
      </div>
    </main>
  );
}