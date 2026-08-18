import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { Talent } from "@/lib/types";
import { RiskDot } from "@/components/ui/RiskDot";
import { HiddenGemBadge } from "@/components/ui/HiddenGemBadge";

function age(birthDate: string): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export function TalentTable({
  talents,
  currentUserHasYouthAccess,
  renderActions,
}: {
  talents: Talent[];
  currentUserHasYouthAccess: boolean;
  renderActions?: (talent: Talent) => ReactNode;
}) {
  const t = useTranslations("talentTable");

  function daysSince(dateString?: string | null): string {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";

    const days = Math.floor(
      (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    return t("daysAgo", { count: days });
  }

  const statusLabels: Partial<Record<Talent["status"], string>> = {
    in_beobachtung: t("statusInBeobachtung"),
    empfehlung: t("statusEmpfehlung"),
    abgeschlossen: t("statusAbgeschlossen"),
    verloren: t("statusVerloren"),
  };

  return (
    <table className="w-full border-collapse overflow-hidden rounded-lg border border-line bg-surface">
      <thead>
        <tr>
          <th className="th-cell">{t("name")}</th>
          <th className="th-cell">{t("position")}</th>
          <th className="th-cell">{t("age")}</th>
          <th className="th-cell">{t("club")}</th>
          <th className="th-cell">{t("status")}</th>
          <th className="th-cell">{t("alert")}</th>
          <th className="th-cell">{t("lastReport")}</th>
          {renderActions && <th className="th-cell" />}
        </tr>
      </thead>
      <tbody>
        {talents.map((talent) => {
          const isMasked = talent.isMinor && !currentUserHasYouthAccess;

          return (
            <tr key={talent.id} className="transition-colors hover:bg-pitch-dim/40">
              <td className="td-cell">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-pitch-dim text-[11px] font-bold text-pitch-dark">
                    {talent.firstName[0]}
                    {talent.lastName[0]}
                  </span>
                  <Link
                    href={`/talents/${talent.id}`}
                    className="font-medium text-ink underline-offset-2 hover:underline"
                  >
                    {talent.firstName} {talent.lastName}
                  </Link>
                  {talent.currentAlert?.isHiddenGem && <HiddenGemBadge />}
                </div>
              </td>
              <td className="td-cell">{talent.primaryPosition}</td>
              <td className="td-cell">{age(talent.birthDate)}</td>
              <td className="td-cell">
                {isMasked ? (
                  <span className="italic text-muted">{t("clubHidden")}</span>
                ) : (
                  <>
                    {talent.clubNameText}
                    {talent.teamNameText ? ` · ${talent.teamNameText}` : ""}
                  </>
                )}
              </td>
              <td className="td-cell">{statusLabels[talent.status] ?? "—"}</td>
              <td className="td-cell">
                {isMasked ? (
                  <span className="text-xs text-muted">{t("restricted")}</span>
                ) : talent.currentAlert ? (
                  <RiskDot level={talent.currentAlert.riskLevel} />
                ) : (
                  "—"
                )}
              </td>
              <td className="td-cell text-muted">{daysSince(talent.lastReportDate)}</td>
              {renderActions && (
                <td className="td-cell text-right">{renderActions(talent)}</td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
