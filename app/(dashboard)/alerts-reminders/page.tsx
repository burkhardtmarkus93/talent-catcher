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
  storniert: "Storniert",
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
      />

      <div className="mb-6 flex gap-6 border-b border-line text-sm">
        <Link
          href="/alerts-reminders?tab=alerts"
          className={`-mb-px border-b-2 py-3 ${
            activeTab === "alerts"
              ? "border-pitch font-medium text-ink"
              : "border-transparent text-muted"
          }`}
        >
          Alerts ({alertTalents.length})
        </Link>
        <Link
          href="/alerts-reminders?tab=reminders"
          className={`-mb-px border-b-2 py-3 ${
            activeTab === "reminders"
              ? "border-pitch font-medium text-ink"
              : "border-transparent text-muted"
          }`}
        >
          Wiedervorlagen ({reminders.length})
        </Link>
      </div>

      {activeTab === "alerts" ? (
        alertTalents.length === 0 ? (
          <p className="rounded-sm border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
            Keine aktiven Alerts — alle Talente sind auf Grün.
          </p>
        ) : (
          <table className="w-full border-collapse rounded-sm border border-line bg-surface">
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
                <tr key={t.id} className="hover:bg-pitch-dim/40">
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
        <p className="rounded-sm border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
          Keine offenen Wiedervorlagen.
        </p>
      ) : (
        <table className="w-full border-collapse rounded-sm border border-line bg-surface">
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
              <tr key={r.id} className="hover:bg-pitch-dim/40">
                <td className="td-cell">
                  <span
                    className={`text-xs font-medium uppercase tracking-wide ${
                      r.status === "ueberfaellig" ? "text-brick" : "text-muted"
                    }`}
                  >
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
