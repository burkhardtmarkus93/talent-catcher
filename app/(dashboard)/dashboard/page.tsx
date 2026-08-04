import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { RiskDot } from "@/components/ui/RiskDot";
import { HiddenGemBadge } from "@/components/ui/HiddenGemBadge";
import { Button } from "@/components/ui/Button";
import { dummyTalents, dummyWatchlists } from "@/lib/dummy-data";

export default function DashboardPage() {
  const urgent = [...dummyTalents]
    .filter((t) => t.currentAlert && t.currentAlert.riskLevel !== "gruen")
    .sort((a, b) => (b.currentAlert?.riskScore ?? 0) - (a.currentAlert?.riskScore ?? 0));

  const openReminders = 12; // Platzhalter, bis Reminder-Query angebunden ist
  const highAlerts = urgent.filter((t) => t.currentAlert?.riskLevel === "rot").length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Überblick über den aktuellen Handlungsbedarf"
        action={
          <Link href="/talents/new">
            <Button>+ Neues Talent</Button>
          </Link>
        }
      />

      {/* Hero-These statt drei gleichgewichtete Statistik-Kacheln:
          Ein klarer Fokuspunkt, Nebenzahlen kleiner daneben. */}
      <div className="mb-8 overflow-hidden rounded-md border border-line bg-surface">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
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
          <div className="flex gap-8 border-t border-line pt-4 md:border-t-0 md:border-l md:pl-8 md:pt-0">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                Talente gesamt
              </p>
              <p className="mt-1 font-mono text-xl text-ink">
                {dummyTalents.length}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                Offene Wiedervorlagen
              </p>
              <p className="mt-1 font-mono text-xl text-ink">
                {openReminders}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-8 rounded-md border border-line bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-ink">
            Dringendster Handlungsbedarf
          </h2>
          <Link href="/talents" className="text-sm text-pitch hover:underline">
            Alle anzeigen →
          </Link>
        </div>

        {urgent.length === 0 ? (
          <p className="rounded-sm bg-paper px-4 py-6 text-center text-sm text-muted">
            Kein akuter Handlungsbedarf. Neue Alerts erscheinen hier automatisch.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {urgent.slice(0, 5).map((t) => (
              <li key={t.id}>
                <Link
                  href={`/talents/${t.id}`}
                  className="flex items-center justify-between rounded-sm border border-line bg-paper px-4 py-3 transition-colors hover:border-pitch"
                >
                  <div className="flex items-center gap-3">
                    <RiskDot level={t.currentAlert!.riskLevel} showLabel={false} />
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
                  <span className="text-sm text-pitch">Öffnen →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8 rounded-md border border-line bg-surface p-5">
        <h2 className="mb-4 font-display text-lg font-medium text-ink">
          Meine Watchlists
        </h2>
        <ul className="flex flex-wrap gap-3">
          {dummyWatchlists.map((w) => (
            <li key={w.id}>
              <Link
                href={`/watchlists/${w.id}`}
                className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-paper px-3 py-1.5 text-sm text-ink transition-colors hover:border-pitch"
              >
                {w.name}
                <span className="text-muted">({w.talentCount})</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Prinzipien-Leiste, sinngemäß übersetzt aus der Bukara-Trust-Leiste:
          kurze, sachliche Vertrauenssignale statt Versand/Zahlung. */}
      <section className="rounded-md border border-line bg-paper p-5">
        <ul className="grid grid-cols-2 gap-4 text-xs text-muted sm:grid-cols-4">
          <li className="flex flex-col gap-1">
            <span className="font-medium text-ink">Jugendschutz eingebaut</span>
            Sensible Daten nur mit Berechtigung sichtbar
          </li>
          <li className="flex flex-col gap-1">
            <span className="font-medium text-ink">Vereinsstrikt getrennt</span>
            Kein Zugriff über Vereinsgrenzen hinweg
          </li>
          <li className="flex flex-col gap-1">
            <span className="font-medium text-ink">DFB-Methodik</span>
            TINDER-Kriterien für Potenzialeinschätzung
          </li>
          <li className="flex flex-col gap-1">
            <span className="font-medium text-ink">Automatische Frühwarnung</span>
            Alerts entstehen aus echten Beobachtungsdaten
          </li>
        </ul>
      </section>
    </div>
  );
}
