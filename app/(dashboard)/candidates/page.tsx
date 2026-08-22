import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getPendingTalentCandidates } from "@/lib/queries/candidates";
import { acceptTalentCandidate, declineTalentCandidate } from "@/lib/actions/candidates";
import {
  requestCandidateVideoUpload,
  cancelCandidateVideoRequest,
} from "@/lib/actions/videos";
import { getOpenVideoRequestsForCandidates } from "@/lib/queries/videoRequests";
import { getDocumentsForCandidate } from "@/lib/queries/candidateDocuments";
import { getVideosForCandidate } from "@/lib/queries/candidateVideos";

function age(birthDate: string): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const [candidates, t] = await Promise.all([
    getPendingTalentCandidates(),
    getTranslations("candidatesPage"),
  ]);

  const candidateIds = candidates.map((c) => c.id);
  const [openVideoRequests, documentsByCandidate, videosByCandidate] = await Promise.all([
    getOpenVideoRequestsForCandidates(candidateIds),
    Promise.all(candidateIds.map((id) => getDocumentsForCandidate(id))),
    Promise.all(candidateIds.map((id) => getVideosForCandidate(id))),
  ]);
  const documentsMap = new Map(candidateIds.map((id, i) => [id, documentsByCandidate[i]]));
  const videosMap = new Map(candidateIds.map((id, i) => [id, videosByCandidate[i]]));

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6" />
            <path d="M22 11h-6" />
          </svg>
        }
      />

      {searchParams?.error ? (
        <div className="mb-4 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
          {searchParams.error}
        </div>
      ) : null}

      {candidates.length === 0 ? (
        <p className="mt-6 text-sm text-muted">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {candidates.map((candidate) => {
            const openRequest = openVideoRequests.get(candidate.id);
            const documents = documentsMap.get(candidate.id) ?? [];
            const videos = videosMap.get(candidate.id) ?? [];

            return (
              <div
                key={candidate.id}
                className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink">
                    {candidate.firstName} {candidate.lastName}
                    {candidate.isMinor && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-brick-dim px-2 py-0.5 text-xs font-medium text-brick">
                        {t("minorBadge")}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {t("candidateMeta", {
                      position: candidate.primaryPosition,
                      age: age(candidate.birthDate),
                    })}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{candidate.contactEmail}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {documents.length > 0 && documents[0].downloadUrl ? (
                      <a
                        href={documents[0].downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-full bg-pitch-dim px-2 py-0.5 font-medium text-pitch underline-offset-2 hover:underline"
                      >
                        {t("vitaAvailable")}
                      </a>
                    ) : (
                      <span className="text-muted">{t("noVita")}</span>
                    )}

                    {videos.length > 0 && videos[0].playbackUrl && (
                      <a
                        href={videos[0].playbackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-full bg-pitch-dim px-2 py-0.5 font-medium text-pitch underline-offset-2 hover:underline"
                      >
                        {t("videoAvailable")}
                      </a>
                    )}

                    {openRequest ? (
                      <form action={cancelCandidateVideoRequest} className="inline-flex">
                        <input type="hidden" name="candidateId" value={candidate.id} />
                        <input type="hidden" name="requestId" value={openRequest.id} />
                        <button
                          type="submit"
                          className="text-brick underline-offset-2 hover:underline"
                        >
                          {t("videoRequestOpenWithdraw")}
                        </button>
                      </form>
                    ) : (
                      <form action={requestCandidateVideoUpload} className="inline-flex">
                        <input type="hidden" name="candidateId" value={candidate.id} />
                        <button
                          type="submit"
                          className="text-pitch underline-offset-2 hover:underline"
                        >
                          {t("requestVideo")}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <form action={declineTalentCandidate}>
                    <input type="hidden" name="candidateId" value={candidate.id} />
                    <Button type="submit" variant="secondary">
                      {t("decline")}
                    </Button>
                  </form>
                  <form action={acceptTalentCandidate}>
                    <input type="hidden" name="candidateId" value={candidate.id} />
                    <Button type="submit">{t("accept")}</Button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
