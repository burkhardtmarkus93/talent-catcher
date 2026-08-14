import { updatePassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";

export default function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-medium text-ink">
            Neues Passwort setzen
          </h1>
          {searchParams.error ? (
            <p className="mt-4 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
              {searchParams.error}
            </p>
          ) : null}
        </div>
        <form action={updatePassword} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-ink">
            Neues Passwort
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="field"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-ink">
            Passwort bestätigen
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={8}
              className="field"
            />
          </label>
          <Button type="submit" className="w-full">
            Passwort speichern
          </Button>
        </form>
      </div>
    </main>
  );
}
