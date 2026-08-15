import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getCurrentAppUser } from "@/lib/queries/session";
import { getClubMembers } from "@/lib/queries/team";
import { getMyProfile } from "@/lib/queries/profile";
import { updateClubName } from "@/lib/actions/club";
import {
  inviteTeamMember,
  updateTeamMemberRole,
  setTeamMemberActive,
} from "@/lib/actions/team";
import { triggerStripeSetup } from "@/lib/actions/adminStripe";
import type { Role } from "@/lib/types";

const roleLabels: Record<Role, string> = {
  scout: "Scout",
  club_admin: "Vereinsleitung",
  admin: "Admin",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const appUser = await getCurrentAppUser();

  if (!appUser?.clubId || appUser.role !== "admin") {
    redirect("/dashboard?error=Nur%20f%C3%BCr%20Vereins-Admins.");
  }

  const [members, profile] = await Promise.all([
    getClubMembers(),
    getMyProfile(),
  ]);

  return (
    <div>
      <PageHeader
        title="Verwaltung"
        subtitle="Vereinsdaten und Team verwalten"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
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
        <h2 className="mb-4 font-display text-lg font-medium text-ink">Verein</h2>
        <form action={updateClubName} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-1 min-w-[220px] flex-col gap-1.5 text-sm text-ink">
            Vereinsname
            <input
              type="text"
              name="name"
              defaultValue={profile?.clubName ?? ""}
              required
              className="field"
            />
          </label>
          <Button type="submit" variant="secondary">
            Speichern
          </Button>
        </form>
      </section>

      <section
        className="animate-fade-in-up mb-8 rounded-xl border border-line bg-surface p-5"
        style={{ animationDelay: "80ms" }}
      >
        <h2 className="mb-4 font-display text-lg font-medium text-ink">
          Team ({members.length})
        </h2>
        <ul className="flex flex-col gap-3">
          {members.map((m) => {
            const initials = m.email.slice(0, 2).toUpperCase();
            const isSelf = m.id === appUser.id;
            return (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-pitch-bright to-pitch text-xs font-semibold text-white shadow-sm">
                    {initials}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {m.fullName || m.email}
                      {isSelf && <span className="ml-1.5 text-xs text-muted">(du)</span>}
                    </p>
                    <p className="text-xs text-muted">{m.email}</p>
                  </div>
                  <span
                    className={`ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      m.isActive ? "bg-pitch-dim text-pitch-dark" : "bg-brick-dim text-brick"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                    {m.isActive ? "Aktiv" : "Deaktiviert"}
                  </span>
                </div>

                {isSelf ? (
                  <span className="text-xs text-muted">
                    {roleLabels[m.role]}
                    {m.hasYouthAccess && " · Jugendschutz-Zugriff"}
                  </span>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <form
                      action={updateTeamMemberRole}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="userId" value={m.id} />
                      <select
                        name="role"
                        defaultValue={m.role === "admin" ? "admin" : "scout"}
                        className="select-field w-auto py-1"
                      >
                        <option value="scout">Scout</option>
                        <option value="admin">Admin</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-xs text-muted">
                        <input
                          type="checkbox"
                          name="hasYouthAccess"
                          defaultChecked={m.hasYouthAccess}
                        />
                        Jugendschutz-Zugriff
                      </label>
                      <Button type="submit" variant="secondary">
                        Speichern
                      </Button>
                    </form>
                    <form action={setTeamMemberActive}>
                      <input type="hidden" name="userId" value={m.id} />
                      <input
                        type="hidden"
                        name="isActive"
                        value={m.isActive ? "false" : "true"}
                      />
                      <Button type="submit" variant="ghost">
                        {m.isActive ? "Deaktivieren" : "Reaktivieren"}
                      </Button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section
        className="animate-fade-in-up rounded-xl border border-line bg-surface p-5"
        style={{ animationDelay: "140ms" }}
      >
        <h2 className="mb-1 font-display text-lg font-medium text-ink">
          Neues Mitglied einladen
        </h2>
        <p className="mb-4 text-xs text-muted">
          Verschickt eine Einladungs-E-Mail mit Link zur Kontoeinrichtung.
        </p>
        <form action={inviteTeamMember} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-1 min-w-[220px] flex-col gap-1.5 text-sm text-ink">
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
            Rolle
            <select name="role" defaultValue="scout" className="select-field">
              <option value="scout">Scout</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <Button type="submit">Einladen</Button>
        </form>
      </section>

      <section
        className="animate-fade-in-up mt-8 rounded-xl border border-line bg-surface p-5"
        style={{ animationDelay: "200ms" }}
      >
        <h2 className="mb-1 font-display text-lg font-medium text-ink">
          Abrechnung einrichten
        </h2>
        <p className="mb-4 text-xs text-muted">
          Legt die Stripe-Produkte/-Preise für alle Selfservice-Pläne an
          (Start, Verein) — einmalig nötig, bevor ein Verein ein Abo
          abschließen kann. Mehrfacher Klick legt nichts doppelt an.
        </p>
        <form action={triggerStripeSetup}>
          <Button type="submit" variant="secondary">
            Stripe-Einrichtung ausführen
          </Button>
        </form>
      </section>
    </div>
  );
}
