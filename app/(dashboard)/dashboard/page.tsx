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

      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatCard label="Talente gesamt" value={dummyTalents.length.toString()} />
        <StatCard label="Offene Wiedervorlagen" value={openReminders.toString()} />
        <StatCard label="Alerts Hoch" value={highAlerts.toString()} accent />
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

        <ul className="divide-y divide-line">
          {urgent.slice(0, 5).map((t) => (
            <li key={t.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <RiskDot level={t.currentAlert!.riskLevel} showLabel={false} />
                <Link href={`/talents/${t.id}`} className="text-sm font-medium text-ink hover:underline">
                  {t.firstName} {t.lastName}
                </Link>
                <span className="text-xs text-muted">
                  {t.primaryPosition} · {t.clubNameText}
                </span>
                {t.currentAlert?.isHiddenGem && <HiddenGemBadge />}
              </div>
              <Link
                href={`/talents/${t.id}`}
                className="text-sm text-pitch hover:underline"
              >
                Öffnen
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-md border border-line bg-surface p-5">
        <h2 className="mb-4 font-display text-lg font-medium text-ink">
          Meine Watchlists
        </h2>
        <ul className="flex flex-wrap gap-4">
          {dummyWatchlists.map((w) => (
            <li key={w.id}>
              <Link
                href={`/watchlists/${w.id}`}
                className="text-sm text-ink hover:underline"
              >
                {w.name}{" "}
                <span className="text-muted">({w.talentCount})</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p
        className={`mt-2 font-mono text-3xl ${
          accent ? "text-brick" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
