import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getGuardianTalents, getMyCandidatures } from "@/lib/queries/guardians";
import { getCurrentAppUser } from "@/lib/queries/session";

function age(birthDate: string): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default async function ParentHomePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const [talents, candidatures, appUser] = await Promise.all([
    getGuardianTalents(),
    getMyCandidatures(),
    getCurrentAppUser(),
  ]);
  const isSelf = appUser?.role === "player";

  // Der Normalfall ist ein Kind bzw. das eigene Profil auf der
  // Plattform — direkt weiter, statt eine Liste mit nur einem Eintrag
  // zu zeigen. Nur, solange daneben keine offene Bewerbung wartet, sonst
  // ginge deren Status/Video-/Vita-Upload-Möglichkeit unter.
  if (talents.length === 1 && candidatures.length === 0) {
    redirect(`/parent/talents/${talents[0].id}`);
  }

  const t = await getTranslations("parentHomePage");

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">
        {isSelf ? t("titleSelf") : t("title")}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {isSelf ? t("subtitleSelf") : t("subtitle")}
      </p>

      {searchParams.error && (
        <div className="mt-4 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
          {decodeURIComponent(searchParams.error)}
        </div>
      )}

      {candidatures.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-sm font-medium uppercase tracking-wide text-muted">
            {t("candidaturesHeading")}
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {candidatures.map((candidature) => (
              <li key={candidature.id}>
                <Link
                  href={`/parent/candidates/${candidature.id}`}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-pitch hover:shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {candidature.firstName} {candidature.lastName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {t("candidaturePositionClub", {
                        position: candidature.primaryPosition,
                        club: candidature.clubName,
                      })}
                    </p>
                  </div>
                  <span className="text-sm text-pitch">{t("open")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {talents.length === 0 && candidatures.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          {isSelf ? t("emptySelf") : t("empty")}
        </p>
      ) : talents.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-2">
          {talents.map((talent) => (
            <li key={talent.id}>
              <Link
                href={`/parent/talents/${talent.id}`}
                className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-pitch hover:shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {talent.firstName} {talent.lastName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {t("positionAge", { position: talent.primaryPosition, age: age(talent.birthDate) })}
                  </p>
                </div>
                <span className="text-sm text-pitch">{t("open")}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
