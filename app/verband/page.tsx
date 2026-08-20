import { getTranslations } from "next-intl/server";
import { getLandesverbandTalents } from "@/lib/queries/landesverband";

function age(birthDate: string): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default async function VerbandHomePage() {
  const [talents, t] = await Promise.all([
    getLandesverbandTalents(),
    getTranslations("verbandHomePage"),
  ]);

  const flagBadges: { key: "dfbStuetzpunkt" | "verbandsauswahl" | "nationalmannschaft" | "nlz" | "euPassport"; label: string }[] = [
    { key: "dfbStuetzpunkt", label: t("dfbStuetzpunkt") },
    { key: "verbandsauswahl", label: t("verbandsauswahl") },
    { key: "nationalmannschaft", label: t("nationalmannschaft") },
    { key: "nlz", label: t("nlz") },
    { key: "euPassport", label: t("euPassport") },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

      {talents.length === 0 ? (
        <p className="mt-6 text-sm text-muted">{t("empty")}</p>
      ) : (
        <table className="mt-6 w-full border-collapse rounded-lg border border-line bg-surface">
          <thead>
            <tr>
              <th className="th-cell">{t("club")}</th>
              <th className="th-cell">{t("name")}</th>
              <th className="th-cell">{t("position")}</th>
              <th className="th-cell">{t("age")}</th>
              <th className="th-cell">{t("flags")}</th>
            </tr>
          </thead>
          <tbody>
            {talents.map((talent) => (
              <tr key={talent.id} className="transition-colors hover:bg-pitch-dim/40">
                <td className="td-cell">{talent.clubRegisteredName}</td>
                <td className="td-cell font-medium text-ink">
                  {talent.firstName} {talent.lastName}
                </td>
                <td className="td-cell">{talent.primaryPosition}</td>
                <td className="td-cell">{age(talent.birthDate)}</td>
                <td className="td-cell">
                  <div className="flex flex-wrap gap-1">
                    {flagBadges
                      .filter((badge) => talent[badge.key])
                      .map((badge) => (
                        <span
                          key={badge.key}
                          className="inline-flex items-center rounded-full bg-pitch-dim px-2 py-0.5 text-xs font-medium text-pitch-dark"
                        >
                          {badge.label}
                        </span>
                      ))}
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
