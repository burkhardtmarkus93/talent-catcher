import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getMyProfile } from "@/lib/queries/profile";
import { updateProfile, changeMyPassword } from "@/lib/actions/profile";
import type { Role } from "@/lib/types";

const roleLabels: Record<Role, string> = {
  scout: "Scout",
  club_admin: "Vereinsleitung",
  admin: "Admin",
  parent: "Eltern",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const profile = await getMyProfile();

  return (
    <div>
      <PageHeader
        title="Mein Profil"
        subtitle="Kontodaten einsehen und bearbeiten"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        }
      />

      {searchParams.error ? (
        <div className="mb-6 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
          {decodeURIComponent(searchParams.error)}
        </div>
      ) : null}
      {searchParams.success ? (
        <div className="mb-6 rounded-lg border border-pitch/30 bg-pitch/5 px-3 py-2 text-sm text-pitch">
          {decodeURIComponent(searchParams.success)}
        </div>
      ) : null}

      <section className="animate-fade-in-up mb-8 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-4 font-display text-lg font-medium text-ink">
          Kontoinformationen
        </h2>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">E-Mail</dt>
            <dd className="mt-0.5 text-ink">{profile?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Rolle</dt>
            <dd className="mt-0.5 text-ink">
              {profile ? roleLabels[profile.role] : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Verein</dt>
            <dd className="mt-0.5 text-ink">{profile?.clubName ?? "—"}</dd>
          </div>
        </dl>
        {profile?.hasYouthAccess && (
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-pitch-dim px-2.5 py-1 text-xs font-semibold text-pitch-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
            Jugendschutz-Zugriff
          </span>
        )}
        <p className="mt-4 text-xs text-muted">
          Eine Änderung der E-Mail-Adresse ist aktuell nicht selbst möglich.
        </p>
      </section>

      <section
        className="animate-fade-in-up mb-8 rounded-xl border border-line bg-surface p-5"
        style={{ animationDelay: "80ms" }}
      >
        <h2 className="mb-4 font-display text-lg font-medium text-ink">
          Profil bearbeiten
        </h2>
        <form action={updateProfile} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-1 min-w-[220px] flex-col gap-1.5 text-sm text-ink">
            Anzeigename
            <input
              type="text"
              name="fullName"
              defaultValue={profile?.fullName ?? ""}
              placeholder="Wie du in Talent Catcher heißen möchtest"
              className="field"
            />
          </label>
          <Button type="submit" variant="secondary">
            Speichern
          </Button>
        </form>
      </section>

      <section
        className="animate-fade-in-up rounded-xl border border-line bg-surface p-5"
        style={{ animationDelay: "140ms" }}
      >
        <h2 className="mb-1 font-display text-lg font-medium text-ink">
          Passwort ändern
        </h2>
        <p className="mb-4 text-xs text-muted">
          Du wirst nach dem Speichern zur Anmeldung weitergeleitet.
        </p>
        <form action={changeMyPassword} className="flex flex-col gap-3 sm:max-w-sm">
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
          <Button type="submit" variant="secondary" className="self-start">
            Passwort speichern
          </Button>
        </form>
      </section>
    </div>
  );
}
