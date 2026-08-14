import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { RiskDot } from "@/components/ui/RiskDot";
import { HiddenGemBadge } from "@/components/ui/HiddenGemBadge";
import { getTalents, getOpenRemindersForClub } from "@/lib/queries/talents";
import { completeReminderManually } from "@/lib/actions/reminders";
import type { ReminderStatus } from "@/lib/types";

const reminderStatusLabels: Record<ReminderStatus, string> = {
  offen: "Offen",
  erledigt: "Erledigt",
  ueberfaellig: "Überfällig",
};

const reminderStatusTone: Record<ReminderStatus, string> = {
  offen: "bg-paper text-muted",
  erledigt: "bg-pitch-dim text-pitch-dark",
  ueberfaellig: "bg-brick-dim text-brick",
};

export default async function AlertsRemindersPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const activeTab = searchParams.tab === "reminders" ? "reminders" : "alerts";

  const [talents, reminders] = await Promise.all([
    getTalents(),
    getOpenRemindersForClub(),
  ]);

  const alertTalents = talents
    .filter((t) => t.currentAlert && t.currentAlert.riskLevel !== "gruen")
    .sort((a, b) => (b.currentAlert?.riskScore ?? 0) - (a.currentAlert?.riskScore ?? 0));

  return (
    <div>
      <PageHeader
        title="Alerts & Wiedervorlagen"
        subtitle="Alle offenen Handlungsaufforderungen an einem Ort"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        }
      />

      <div className="mb-6 inline-flex gap-1 rounded-lg bg-paper p-1 text-sm">
        <Link
          href="/alerts-reminders?tab=alerts"
          className={`rounded-md px-4 py-1.5 transition-colors ${
            activeTab === "alerts"
              ? "bg-surface font-medium text-ink shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          Alerts ({alertTalents.length})
        </Link>
        <Link
          href="/alerts-reminders?tab=reminders"
          className={`rounded-md px-4 py-1.5 transition-colors ${
            activeTab === "reminders"
              ? "bg-surface font-medium text-ink shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          Wiedervorlagen ({reminders.length})
        </Link>
      </div>

      {activeTab === "alerts" ? (
        alertTalents.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
            Keine aktiven Alerts — alle Talente sind auf Grün.
          </p>
        ) : (
          <table className="animate-fade-in-up w-full border-collapse rounded-lg border border-line bg-surface">
            <thead>
              <tr>
                <th className="th-cell">Priorität</th>
                <th className="th-cell">Talent</th>
                <th className="th-cell">Begründung</th>
                <th className="th-cell text-right">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {alertTalents.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-pitch-dim/40">
                  <td className="td-cell">
                    <RiskDot level={t.currentAlert!.riskLevel} showLabel />
                  </td>
                  <td className="td-cell">
                    <Link href={`/talents/${t.id}`} className="font-medium hover:underline">
                      {t.firstName} {t.lastName}
                    </Link>{" "}
                    {t.currentAlert?.isHiddenGem && <HiddenGemBadge />}
                  </td>
                  <td className="td-cell text-muted">
                    {t.currentAlert?.triggeredReasons.length
                      ? t.currentAlert.triggeredReasons.join(" · ")
                      : "—"}
                  </td>
                  <td className="td-cell text-right">
                    <Link href={`/talents/${t.id}/reports/new`}>
                      <Button variant="secondary">Bericht erfassen</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : reminders.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
          Keine offenen Wiedervorlagen.
        </p>
      ) : (
        <table className="animate-fade-in-up w-full border-collapse rounded-lg border border-line bg-surface">
          <thead>
            <tr>
              <th className="th-cell">Status</th>
              <th className="th-cell">Talent</th>
              <th className="th-cell">Fällig am</th>
              <th className="th-cell">Grund</th>
              <th className="th-cell text-right">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {reminders.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-pitch-dim/40">
                <td className="td-cell">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${reminderStatusTone[r.status]}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                    {reminderStatusLabels[r.status]}
                  </span>
                </td>
                <td className="td-cell">
                  <Link href={`/talents/${r.talentId}`} className="font-medium hover:underline">
                    {r.talentName}
                  </Link>
                </td>
                <td className="td-cell text-muted">{r.dueDate}</td>
                <td className="td-cell text-muted">
                  {r.reason}
                  {r.isSystemGenerated && (
                    <span className="ml-2 font-mono text-[10px] uppercase text-muted">
                      automatisch
                    </span>
                  )}
                </td>
                <td className="td-cell text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/talents/${r.talentId}/reports/new?reminderId=${r.id}`}>
                      <Button variant="secondary">Bericht erfassen</Button>
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await completeReminderManually(r.id);
                      }}
                    >
                      <Button variant="ghost" type="submit">
                        Ohne Bericht erledigen
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
