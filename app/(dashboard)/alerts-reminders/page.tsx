import Link from "next/link";
import { getOpenRemindersForClub, getTalents } from "@/lib/queries/talents";
import { completeReminderManually } from "@/lib/actions/reminders";
import type { ReminderStatus } from "@/lib/types";

const reminderStatusLabels: Record<ReminderStatus, string> = {
  offen: "Offen",
  erledigt: "Erledigt",
  ueberfaellig: "Überfällig",
};

export default async function AlertsRemindersPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const status = searchParams?.status ?? "offen";

  const [talents, reminders] = await Promise.all([
    getTalents({ showArchived: true }),
    getOpenRemindersForClub(),
  ]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium text-ink">
          Alerts & Wiedervorlagen
        </h1>

        <Link href="/talents" className="text-sm text-pitch hover:underline">
          Zur Talentliste
        </Link>
      </div>

      <section className="rounded-md border border-line bg-surface p-5">
        <h2 className="mb-4 font-display text-lg font-medium text-ink">
          Status
        </h2>

        <div className="flex flex-wrap gap-2">
          {Object.entries(reminderStatusLabels).map(([key, label]) => (
            <Link
              key={key}
              href={`/alerts-reminders?status=${key}`}
              className={`rounded-sm border px-3 py-1 text-sm ${
                status === key
                  ? "border-pitch bg-pitch text-white"
                  : "border-line bg-white text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-md border border-line bg-surface p-5">
        <h2 className="mb-4 font-display text-lg font-medium text-ink">
          Wiedervorlagen
        </h2>

        {reminders.length === 0 ? (
          <p className="text-sm text-muted">Keine offenen Wiedervorlagen.</p>
        ) : (
          <ul className="space-y-3">
            {reminders.map((reminder) => (
              <li key={reminder.id} className="rounded-sm bg-paper p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {reminder.talentName}
                    </p>
                    <p className="text-xs text-muted">
                      {reminder.reason ?? "Ohne Begründung"}
                    </p>
                  </div>
                  <span className="text-xs text-muted">{reminder.dueDate}</span>
                </div>

                <form action={completeReminderManually} className="mt-3">
                  <input type="hidden" name="reminderId" value={reminder.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-pitch bg-white px-3 py-1 text-sm text-pitch hover:bg-pitch hover:text-white"
                  >
                    Als erledigt markieren
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
