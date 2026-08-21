import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { VideoUploadForm } from "@/components/videos/VideoUploadForm";
import { getGuardianTalent } from "@/lib/queries/guardians";
import { updateGuardianTalentClub } from "@/lib/actions/guardians";
import { getVideosForTalent } from "@/lib/queries/videos";
import { hasGrantedVideoConsent } from "@/lib/queries/consent";
import { getOpenVideoRequest } from "@/lib/queries/videoRequests";

function age(birthDate: string): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default async function ParentTalentPage({
  params,
  searchParams,
}: {
  params: { talentId: string };
  searchParams: { success?: string; error?: string };
}) {
  const talent = await getGuardianTalent(params.talentId);
  if (!talent) notFound();

  const [videos, hasConsent, openVideoRequest, t] = await Promise.all([
    getVideosForTalent(talent.id),
    talent.isMinor ? hasGrantedVideoConsent(talent.id) : Promise.resolve(true),
    getOpenVideoRequest(talent.id),
    getTranslations("parentTalentPage"),
  ]);
  const canUploadVideo = hasConsent && Boolean(openVideoRequest);

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return "—";
    return t("fileSizeMb", { size: (bytes / (1024 * 1024)).toFixed(1) });
  }

  const fullName = `${talent.firstName} ${talent.lastName}`;

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">{fullName}</h1>
      <p className="mt-1 text-sm text-muted">
        {t("positionAge", { position: talent.primaryPosition, age: age(talent.birthDate) })}
      </p>

      {searchParams.success && (
        <div className="mt-4 rounded-lg border border-pitch/30 bg-pitch/5 px-3 py-2 text-sm text-pitch">
          {decodeURIComponent(searchParams.success)}
        </div>
      )}
      {searchParams.error && (
        <div className="mt-4 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
          {decodeURIComponent(searchParams.error)}
        </div>
      )}

      <section className="mt-6 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-1 font-display text-lg font-medium text-ink">
          {t("clubAndTeam")}
        </h2>
        <p className="mb-4 text-xs text-muted">
          {t("clubAndTeamHint", { firstName: talent.firstName })}
        </p>
        <form
          action={updateGuardianTalentClub}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <input type="hidden" name="talentId" value={talent.id} />
          <label className="flex flex-col gap-1.5 text-sm text-ink">
            {t("currentClub")}
            <input
              type="text"
              name="clubNameText"
              defaultValue={talent.clubNameText ?? ""}
              required
              className="field"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-ink">
            {t("team")}
            <input
              type="text"
              name="teamNameText"
              defaultValue={talent.teamNameText ?? ""}
              placeholder={t("teamPlaceholder")}
              className="field"
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary">
              {t("save")}
            </Button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-4 font-display text-lg font-medium text-ink">
          {t("videos")}
        </h2>

        {videos.length === 0 ? (
          <p className="mb-4 text-sm text-muted">{t("noVideos")}</p>
        ) : (
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {videos.map((v) => (
              <div key={v.id} className="overflow-hidden rounded-lg border border-line bg-paper">
                {v.playbackUrl ? (
                  <video controls className="aspect-video w-full bg-black" preload="metadata">
                    <source src={v.playbackUrl} type="video/mp4" />
                  </video>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-ink/5 text-xs text-muted">
                    {t("videoUnavailable")}
                  </div>
                )}
                <div className="px-3 py-2 text-xs text-muted">
                  {formatFileSize(v.fileSizeBytes)}
                </div>
              </div>
            ))}
          </div>
        )}

        {canUploadVideo ? (
          <div className="flex flex-col gap-3">
            {openVideoRequest?.note && (
              <p className="rounded-lg bg-paper px-4 py-3 text-sm text-ink">
                {t("videoRequestNote", { note: openVideoRequest.note })}
              </p>
            )}
            <VideoUploadForm talentId={talent.id} clubId={talent.clubId} />
          </div>
        ) : !hasConsent ? (
          <p className="rounded-lg bg-amber-dim px-4 py-3 text-sm text-amber-dark">
            {t("noConsent", { firstName: talent.firstName })}
          </p>
        ) : (
          <p className="rounded-lg bg-paper px-4 py-3 text-sm text-muted">
            {t("noRequest")}
          </p>
        )}
      </section>
    </div>
  );
}
