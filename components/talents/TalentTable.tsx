import Link from "next/link";
import type { Talent } from "@/lib/types";
import { RiskDot } from "@/components/ui/RiskDot";
import { HiddenGemBadge } from "@/components/ui/HiddenGemBadge";

function age(birthDate: string): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function daysSince(dateString?: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  const days = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  return `${days} Tage`;
}

const statusLabels: Partial<Record<Talent["status"], string>> = {
  in_beobachtung: "In Beobachtung",
  empfehlung: "Empfehlung",
  abgeschlossen: "Abgeschlossen",
  verloren: "Verloren",
};

export function TalentTable({
  talents,
  currentUserHasYouthAccess,
}: {
  talents: Talent[];
  currentUserHasYouthAccess: boolean;
}) {
  return (
    <table className="w-full border-collapse overflow-hidden rounded-lg border border-line bg-surface">
      <thead>
        <tr>
          <th className="th-cell">Name</th>
          <th className="th-cell">Position</th>
          <th className="th-cell">Alter</th>
          <th className="th-cell">Verein</th>
          <th className="th-cell">Status</th>
          <th className="th-cell">Ampel</th>
          <th className="th-cell">Letzter Bericht</th>
        </tr>
      </thead>
      <tbody>
        {talents.map((t) => {
          const isMasked = t.isMinor && !currentUserHasYouthAccess;

          return (
            <tr key={t.id} className="transition-colors hover:bg-pitch-dim/40">
              <td className="td-cell">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-pitch-dim text-[11px] font-bold text-pitch-dark">
                    {t.firstName[0]}
                    {t.lastName[0]}
                  </span>
                  <Link
                    href={`/talents/${t.id}`}
                    className="font-medium text-ink underline-offset-2 hover:underline"
                  >
                    {t.firstName} {t.lastName}
                  </Link>
                  {t.currentAlert?.isHiddenGem && <HiddenGemBadge />}
                </div>
              </td>
              <td className="td-cell">{t.primaryPosition}</td>
              <td className="td-cell">{age(t.birthDate)}</td>
              <td className="td-cell">
                {isMasked ? (
                  <span className="italic text-muted">Verein ausgeblendet</span>
                ) : (
                  <>
                    {t.clubNameText}
                    {t.teamNameText ? ` · ${t.teamNameText}` : ""}
                  </>
                )}
              </td>
              <td className="td-cell">{statusLabels[t.status] ?? "—"}</td>
              <td className="td-cell">
                {isMasked ? (
                  <span className="text-xs text-muted">Zugriff eingeschränkt</span>
                ) : t.currentAlert ? (
                  <RiskDot level={t.currentAlert.riskLevel} />
                ) : (
                  "—"
                )}
              </td>
              <td className="td-cell text-muted">{daysSince(t.lastReportDate)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
