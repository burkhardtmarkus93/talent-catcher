import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { RiskDot } from "@/components/ui/RiskDot";
import { HiddenGemBadge } from "@/components/ui/HiddenGemBadge";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import {
  getTalentById,
  getScoutReportsForTalent,
  getOpenRemindersForTalent,
} from "@/lib/queries/talents";
import { archiveTalent, restoreTalent } from "@/lib/actions/talents";
import { getGkCoordinationTestsForTalent } from "@/lib/queries/gkTests";
import { getTalentActivityStatus } from "@/lib/queries/talentActivity";
import { InactivityBanner } from "@/components/talents/InactivityBanner";

function age(birthDate: string): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default async function TalentDetailPage({
  params,
}: {
  params: { talentId: string };
}) {
  const talent = await getTalentById(params.talentId);
  if (!talent) notFound();

  const fullName = `${talent.firstName} ${talent.lastName}`;
  const [reports, openReminders, gkTests, activityStatus] = await Promise.all([
    getScoutReportsForTalent(talent.id),
    getOpenRemindersForTalent(talent.id, fullName),
    talent.primaryPosition === "TW"
      ? getGkCoordinationTestsForTalent(talent.id)
      : Promise.resolve([]),
    getTalentActivityStatus(talent.id, talent.updatedAt),
  ]);

  return (
    <div>
      <Link href="/talents" className="text-sm text-muted hover:underline">
        ← Zurück zur Talentliste
      </Link>

      {activityStatus.isInactive && (
        <InactivityBanner
          talentId={talent.id}
          lastActivityAt={activityStatus.lastActivityAt}
        />
      )}

      <div className="mt-4 flex items-stretch overflow-hidden rounded-md border border-line bg-surface">
        <div
          className={`w-1.5 shrink-0 ${
            talent.currentAlert?.riskLevel === "rot"
              ? "bg-brick"
              : talent.currentAlert?.riskLevel === "gelb"
              ? "bg-amber"
              : "bg-pitch"
          }`}
          aria-hidden
        />
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-medium text-ink">
                {fullName}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {talent.primaryPosition} · {age(talent.birthDate)} Jahre ·{" "}
                {talent.clubNameText}
                {talent.teamNameText ? ` ${talent.teamNameText}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {talent.currentAlert?.isHiddenGem && <HiddenGemBadge />}
              {talent.currentAlert && (
                <RiskDot level={talent.currentAlert.riskLevel} />
              )}
            </div>
          </div>

          {talent.currentAlert && talent.currentAlert.triggeredReasons.length > 0 && (
            <div className="mt-4 rounded-sm bg-paper px-4 py-3 text-sm text-ink">
              <span className="font-medium">Begründung: </span>
              {talent.currentAlert.triggeredReasons.join(" · ")}
            </div>
          )}

          {!talent.currentAlert && (
            <p className="mt-4 text-sm text-muted">
              Noch keine Risikobewertung vorhanden (wird nach der ersten
              Neuberechnung angezeigt).
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <section className="rounded-md border border-line bg-surface p-5">
            <h2 className="mb-4 font-display text-lg font-medium text-ink">
              Übersicht
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Status" value={talent.status.replace("_", " ")} />
              <Field
                label="Vertragsstatus"
                value={`${talent.contractStatus}${
                  talent.contractEndDate ? `, bis ${talent.contractEndDate}` : ""
                }`}
              />
              <Field label="Liga" value={talent.leagueText ?? "—"} />
              <Field label="Land" value={talent.countryText ?? "—"} />
              <Field label="Minderjährig" value={talent.isMinor ? "Ja" : "Nein"} />
              <Field
                label="Sichtbarkeit"
                value={talent.visibilityStatus === "privat" ? "Privat" : "Freigegeben"}
              />
            </dl>
          </section>

          <section className="mt-6 rounded-md border border-line bg-surface p-5">
            <h2 className="mb-4 font-display text-lg font-medium text-ink">
              Berichtsverlauf
            </h2>
            {reports.length === 0 ? (
              <p className="text-sm text-muted">
                Noch keine Berichte vorhanden — der erste Bericht legt die
                Ausgangsbewertung fest.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {reports.map((r) => (
                  <li key={r.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">
                        {r.matchDate} {r.opponent ? `vs. ${r.opponent}` : ""}
                      </span>
                      <span className="font-mono text-sm text-ink">
                        {r.overallRating.toFixed(1)}
                        {r.overallRatingSource === "manual_override" && (
                          <span className="ml-1 text-xs text-muted">(manuell)</span>
                        )}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="mt-1 text-sm text-muted">{r.comment}</p>
                    )}
                    <p className="mt-1 text-xs text-muted">{r.authorName}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {talent.primaryPosition === "TW" && (
            <section className="mt-6 rounded-md border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-medium text-ink">
                  Koordinationstest (Torhüter)
                </h2>
                <Link
                  href={`/talents/${talent.id}/gk-tests/new`}
                  className="text-sm text-pitch hover:underline"
                >
                  + Neuer Test
                </Link>
              </div>
              {gkTests.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  Noch kein Koordinationstest erfasst.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {gkTests.map((t) => (
                    <li key={t.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-ink">
                          {t.testDate} {t.ageCategory ? `· ${t.ageCategory}` : ""}
                        </span>
                        <span className="font-mono text-sm text-ink">
                          {t.totalScore ?? "—"} Pkt.
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Link href={`/talents/${talent.id}/reports/new`}>
              <Button className="w-full">+ Neuer Bericht</Button>
            </Link>

            {talent.archivedAt ? (
              <form action={restoreTalent}>
                <input type="hidden" name="talentId" value={talent.id} />
                <button
                  type="submit"
                  className="w-full rounded-md border border-pitch bg-emerald-50 px-4 py-2 text-sm font-medium text-pitch hover:bg-emerald-100"
                >
                  Talent wiederherstellen
                </button>
              </form>
            ) : (
              <form action={archiveTalent}>
                <input type="hidden" name="talentId" value={talent.id} />
                <button
                  type="submit"
                  className="w-full rounded-md border border-amber-500 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
                >
                  Talent archivieren
                </button>
              </form>
            )}
          </div>

          <div id="reminder-form">
            <ReminderForm talentId={talent.id} />
          </div>

          <section className="rounded-md border border-line bg-surface p-4">
            <h2 className="mb-3 font-display text-base font-medium text-ink">
              Offene Wiedervorlagen
            </h2>
            {openReminders.length === 0 ? (
              <p className="text-sm text-muted">Keine offenen Wiedervorlagen.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {openReminders.map((reminder) => (
                  <li key={reminder.id} className="rounded-sm bg-paper p-3">
                    <p
                      className={`text-xs font-medium uppercase tracking-wide ${
                        reminder.status === "ueberfaellig" ? "text-brick" : "text-muted"
                      }`}
                    >
                      {reminder.status === "ueberfaellig" ? "Überfällig" : "Offen"} ·{" "}
                      {reminder.dueDate}
                    </p>
                    {reminder.reason && (
                      <p className="mt-1 text-sm text-ink">{reminder.reason}</p>
                    )}
                    <Link
                      href={`/talents/${talent.id}/reports/new?reminderId=${reminder.id}`}
                      className="mt-2 inline-block text-sm text-pitch hover:underline"
                    >
                      Bericht erfassen →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  );
}
