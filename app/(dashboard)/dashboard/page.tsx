import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { RiskDot } from "@/components/ui/RiskDot";
import { HiddenGemBadge } from "@/components/ui/HiddenGemBadge";
import { Button } from "@/components/ui/Button";
import { getTalents, getOpenRemindersForClub } from "@/lib/queries/talents";
import { getWatchlists } from "@/lib/queries/watchlists";

export default async function DashboardPage() {
  const [talents, openReminders, watchlists] = await Promise.all([
    getTalents(),
    getOpenRemindersForClub(),
    getWatchlists(),
  ]);

  const urgent = [...talents]
    .filter((t) => t.currentAlert && t.currentAlert.riskLevel !== "gruen")
    .sort((a, b) => (b.currentAlert?.riskScore ?? 0) - (a.currentAlert?.riskScore ?? 0));

  const highAlerts = urgent.filter((t) => t.currentAlert?.riskLevel === "rot").length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Überblick über den aktuellen Handlungsbedarf"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z" />
          </svg>
        }
        action={
          <Link href="/talents/new">
            <Button>+ Neues Talent</Button>
          </Link>
        }
      />

      {/* Hero-These statt drei gleichgewichtete Statistik-Kacheln:
          Ein klarer Fokuspunkt, Nebenzahlen kleiner daneben. */}
      <div className="animate-fade-in-up relative mb-8 overflow-hidden rounded-xl border border-line bg-surface">
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-pitch-bright/25 to-pitch/0 blur-2xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">
              Jetzt wichtig
            </p>
            <p className="mt-1 font-display text-3xl font-medium text-ink">
              {highAlerts > 0 ? (
                <>
                  <span className="text-brick">{highAlerts}</span>{" "}
                  {highAlerts === 1 ? "Talent braucht" : "Talente brauchen"}{" "}
                  jetzt Aufmerksamkeit
                </>
              ) : (
                "Keine dringenden Alerts — alles im grünen Bereich"
              )}
            </p>
          </div>
          <div className="flex gap-4 border-t border-line pt-4 md:border-t-0 md:border-l md:pl-8 md:pt-0">
            <div className="flex items-start gap-3 rounded-lg bg-paper px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-pitch-bright to-pitch text-white shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">
                  Talente gesamt
                </p>
                <p className="mt-0.5 font-mono text-xl text-ink">
                  {talents.length}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-paper px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-amber-dim text-amber-dark">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">
                  Offene Wiedervorlagen
                </p>
                <p className="mt-0.5 font-mono text-xl text-ink">
                  {openReminders.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section
        className="animate-fade-in-up mb-8 rounded-xl border border-line bg-surface p-5"
        style={{ animationDelay: "80ms" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-ink">
            Dringendster Handlungsbedarf
          </h2>
          <Link
            href="/talents"
            className="text-sm text-pitch transition-transform hover:translate-x-0.5 hover:underline"
          >
            Alle anzeigen →
          </Link>
        </div>

        {urgent.length === 0 ? (
          <p className="rounded-lg bg-paper px-4 py-6 text-center text-sm text-muted">
            Kein akuter Handlungsbedarf. Neue Alerts erscheinen hier automatisch.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {urgent.slice(0, 5).map((t, i) => (
              <li
                key={t.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${120 + i * 40}ms` }}
              >
                <Link
                  href={`/talents/${t.id}`}
                  className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-pitch hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-pitch-dim text-xs font-bold text-pitch-dark">
                      {t.firstName[0]}
                      {t.lastName[0]}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {t.firstName} {t.lastName}
                      </p>
                      <p className="text-xs text-muted">
                        {t.primaryPosition} · {t.clubNameText}
                      </p>
                    </div>
                    {t.currentAlert?.isHiddenGem && <HiddenGemBadge />}
                  </div>
                  <div className="flex items-center gap-3">
                    <RiskDot level={t.currentAlert!.riskLevel} />
                    <span className="text-sm text-pitch">Öffnen →</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="animate-fade-in-up mb-8 rounded-xl border border-line bg-surface p-5"
        style={{ animationDelay: "140ms" }}
      >
        <h2 className="mb-4 font-display text-lg font-medium text-ink">
          Meine Watchlists
        </h2>
        {watchlists.length === 0 ? (
          <p className="rounded-lg bg-paper px-4 py-6 text-center text-sm text-muted">
            Noch keine Watchlist angelegt.
          </p>
        ) : (
        <ul className="flex flex-wrap gap-3">
          {watchlists.map((w) => (
            <li key={w.id}>
              <Link
                href={`/watchlists/${w.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink transition-all duration-150 hover:-translate-y-0.5 hover:border-pitch hover:shadow-sm"
              >
                {w.name}
                <span className="text-muted">({w.talentCount})</span>
              </Link>
            </li>
          ))}
        </ul>
        )}
      </section>

      {/* Prinzipien-Leiste, sinngemäß übersetzt aus der Bukara-Trust-Leiste:
          kurze, sachliche Vertrauenssignale statt Versand/Zahlung. */}
      <section
        className="animate-fade-in-up rounded-xl border border-line bg-paper p-5"
        style={{ animationDelay: "200ms" }}
      >
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              title: "Jugendschutz eingebaut",
              text: "Sensible Daten nur mit Berechtigung sichtbar",
              icon: (
                <path d="M12 2 4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3Z" />
              ),
            },
            {
              title: "Vereinsstrikt getrennt",
              text: "Kein Zugriff über Vereinsgrenzen hinweg",
              icon: (
                <>
                  <rect x="3" y="10" width="7" height="10" rx="1" />
                  <rect x="14" y="6" width="7" height="14" rx="1" />
                </>
              ),
            },
            {
              title: "DFB-Methodik",
              text: "TINDER-Kriterien für Potenzialeinschätzung",
              icon: (
                <>
                  <path d="m9 11 3 3L22 4" />
                  <path d="M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11" />
                </>
              ),
            },
            {
              title: "Automatische Frühwarnung",
              text: "Alerts entstehen aus echten Beobachtungsdaten",
              icon: (
                <>
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </>
              ),
            },
          ].map((item) => (
            <li
              key={item.title}
              className="flex flex-col gap-2 rounded-lg p-2 text-xs text-muted transition-all duration-150 hover:-translate-y-0.5 hover:bg-surface hover:shadow-sm"
            >
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-pitch-dim text-pitch-dark">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {item.icon}
                </svg>
              </span>
              <span className="font-medium text-ink">{item.title}</span>
              {item.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
