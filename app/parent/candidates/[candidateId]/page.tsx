import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CandidateVideoUploadForm } from "@/components/candidates/CandidateVideoUploadForm";
import { CandidateVitaUploadForm } from "@/components/candidates/CandidateVitaUploadForm";
import { getMyCandidature } from "@/lib/queries/guardians";
import { getVideosForCandidate } from "@/lib/queries/candidateVideos";
import { getDocumentsForCandidate } from "@/lib/queries/candidateDocuments";
import { getOpenVideoRequestForCandidate } from "@/lib/queries/videoRequests";

function age(birthDate: string): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function statusLabel(
  status: string,
  t: Awaited<ReturnType<typeof getTranslations<"parentCandidatePage">>>
): string {
  switch (status) {
    case "pending_guardian_consent":
      return t("statusPendingConsent");
    case "pending_payment":
      return t("statusPendingPayment");
    case "accepted":
      return t("statusAccepted");
    case "declined":
      return t("statusDeclined");
    default:
      return t("statusPendingReview");
  }
}

export default async function ParentCandidatePage({
  params,
}: {
  params: { candidateId: string };
}) {
  const candidature = await getMyCandidature(params.candidateId);
  if (!candidature) notFound();

  const isPending = candidature.status === "pending_review";

  const [videos, documents, openVideoRequest, t] = await Promise.all([
    getVideosForCandidate(candidature.id),
    getDocumentsForCandidate(candidature.id),
    getOpenVideoRequestForCandidate(candidature.id),
    getTranslations("parentCandidatePage"),
  ]);

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return "—";
    return t("fileSizeMb", { size: (bytes / (1024 * 1024)).toFixed(1) });
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">
        {candidature.firstName} {candidature.lastName}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {t("positionAgeClub", {
          position: candidature.primaryPosition,
          age: age(candidature.birthDate),
          club: candidature.clubName,
        })}
      </p>

      <div className="mt-4 inline-flex items-center rounded-full bg-pitch-dim px-3 py-1 text-sm font-medium text-pitch">
        {statusLabel(candidature.status, t)}
      </div>

      <section className="mt-8">
        <h2 className="font-display text-base font-medium text-ink">{t("videoHeading")}</h2>
        {openVideoRequest && isPending ? (
          <>
            <p className="mt-1 text-sm text-muted">
              {openVideoRequest.note
                ? t("videoRequestedWithNote", { note: openVideoRequest.note })
                : t("videoRequested")}
            </p>
            <div className="mt-3">
              <CandidateVideoUploadForm candidateId={candidature.id} clubId={candidature.clubId} />
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted">{t("noVideoRequest")}</p>
        )}

        {videos.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {videos.map((video) => (
              <li
                key={video.id}
                className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-sm"
              >
                <span className="text-muted">{formatFileSize(video.fileSizeBytes)}</span>
                {video.playbackUrl && (
                  <a
                    href={video.playbackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pitch underline-offset-2 hover:underline"
                  >
                    {t("watch")}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-base font-medium text-ink">{t("vitaHeading")}</h2>
        <p className="mt-1 text-sm text-muted">{t("vitaHint")}</p>
        {isPending && (
          <div className="mt-3">
            <CandidateVitaUploadForm candidateId={candidature.id} clubId={candidature.clubId} />
          </div>
        )}

        {documents.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-sm"
              >
                <span className="text-muted uppercase">{doc.fileType}</span>
                {doc.downloadUrl && (
                  <a
                    href={doc.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pitch underline-offset-2 hover:underline"
                  >
                    {t("open")}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
