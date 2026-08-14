import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LogoLockup } from "@/components/ui/LogoLockup";
import { PlanSelector } from "@/components/auth/PlanSelector";
import { signUp } from "@/lib/actions/auth";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-3xl rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <LogoLockup height={90} className="mb-2" />
          <h1 className="font-display text-xl font-medium text-ink">
            für deinen Verein einrichten
          </h1>
          <p className="mt-1 text-sm text-muted">
            Ein Konto pro Verein — du wirst automatisch Admin.
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-pitch-dim px-3 py-1 text-xs font-semibold text-pitch-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
            3 Tage kostenlos testen — keine Zahlungsdaten nötig
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
              Vereinsname
              <input
                type="text"
                name="clubName"
                required
                placeholder="FC Beispiel"
                className="field"
              />
            </label>

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

            <label className="flex flex-col gap-1.5 text-sm text-ink sm:col-span-2">
              Passwort
              <input
                type="password"
                name="password"
                required
                minLength={8}
                placeholder="Mindestens 8 Zeichen"
                className="field"
              />
            </label>
          </div>

          <div>
            <p className="mb-1 text-center text-sm font-medium text-ink">
              Plan für nach der Testphase wählen
            </p>
            <p className="mb-4 text-center text-xs text-muted">
              Wird erst nach den 3 kostenlosen Tagen aktiv — du kannst das jederzeit auf der Abo-Seite ändern.
            </p>
            <PlanSelector />
          </div>

          <Button type="submit" className="w-full">
            Kostenlos starten
          </Button>

          <p className="text-center text-xs text-muted">
            Mit der Registrierung akzeptierst du, dass dein Verein für die Verarbeitung von
            Talentdaten Minderjähriger verantwortlich ist und die dafür nötigen
            Einwilligungen einholt. Nach 3 Tagen wird ein kostenpflichtiger Plan benötigt.
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
