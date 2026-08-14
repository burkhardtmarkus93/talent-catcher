import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/LogoMark";
import { PlanSelector } from "@/components/auth/PlanSelector";
import { signUp } from "@/lib/actions/auth";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-3xl rounded-md border border-line bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <LogoMark className="mx-auto mb-3 h-9 w-9 text-pitch" />
          <h1 className="font-display text-2xl font-medium text-ink">
            Talent Catcher für deinen Verein einrichten
          </h1>
          <p className="mt-1 text-sm text-muted">
            Ein Konto pro Verein — du wirst automatisch Admin.
          </p>
        </div>

        {searchParams.error ? (
          <div className="mb-6 rounded-sm border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
            {searchParams.error}
          </div>
        ) : null}

        <form action={signUp} className="flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm text-ink">
              Vereinsname
              <input
                type="text"
                name="clubName"
                required
                placeholder="FC Beispiel"
                className="rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-pitch"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-ink">
              E-Mail
              <input
                type="email"
                name="email"
                required
                placeholder="scout@verein.de"
                className="rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-pitch"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-ink sm:col-span-2">
              Passwort
              <input
                type="password"
                name="password"
                required
                minLength={8}
                placeholder="Mindestens 8 Zeichen"
                className="rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-pitch"
              />
            </label>
          </div>

          <div>
            <p className="mb-4 text-center text-sm font-medium text-ink">Plan wählen</p>
            <PlanSelector />
          </div>

          <Button type="submit" className="w-full">
            Kostenpflichtig registrieren
          </Button>

          <p className="text-center text-xs text-muted">
            Mit der Registrierung akzeptierst du, dass dein Verein für die Verarbeitung von
            Talentdaten Minderjähriger verantwortlich ist und die dafür nötigen
            Einwilligungen einholt.
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Schon ein Konto?{" "}
          <Link href="/login" className="text-pitch underline-offset-2 hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </main>
  );
}
