import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { VideoUploadForm } from "@/components/videos/VideoUploadForm";
import { getGuardianTalent } from "@/lib/queries/guardians";
import { updateGuardianTalentClub } from "@/lib/actions/guardians";
import { getVideosForTalent } from "@/lib/queries/videos";
import { hasGrantedVideoConsent } from "@/lib/queries/consent";

function age(birthDate: string): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  const [videos, canUploadVideo] = await Promise.all([
    getVideosForTalent(talent.id),
    talent.isMinor ? hasGrantedVideoConsent(talent.id) : Promise.resolve(true),
  ]);

  const fullName = `${talent.firstName} ${talent.lastName}`;

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink">{fullName}</h1>
      <p className="mt-1 text-sm text-muted">
        {talent.primaryPosition} · {age(talent.birthDate)} Jahre
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
          Verein &amp; Team
        </h2>
        <p className="mb-4 text-xs text-muted">
          Wenn euer Verein wechselt, könnt ihr das hier direkt aktualisieren —
          der Scout, der {talent.firstName} beobachtet, sieht das dann
          automatisch. Alle anderen Angaben (Position, Bewertungen) pflegt
          weiterhin ausschließlich der Verein.
        </p>
        <form
          action={updateGuardianTalentClub}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <input type="hidden" name="talentId" value={talent.id} />
          <label className="flex flex-col gap-1.5 text-sm text-ink">
            Aktueller Verein *
            <input
              type="text"
              name="clubNameText"
              defaultValue={talent.clubNameText ?? ""}
              required
              className="field"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-ink">
            Team/Jahrgang
            <input
              type="text"
              name="teamNameText"
              defaultValue={talent.teamNameText ?? ""}
              placeholder="z. B. U17"
              className="field"
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary">
              Speichern
            </Button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-4 font-display text-lg font-medium text-ink">
          Videos
        </h2>

        {videos.length === 0 ? (
          <p className="mb-4 text-sm text-muted">Noch keine Videos hochgeladen.</p>
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
                    Video nicht verfügbar
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
          <VideoUploadForm talentId={talent.id} clubId={talent.clubId} />
        ) : (
          <p className="rounded-lg bg-amber-dim px-4 py-3 text-sm text-amber-dark">
            Für den Video-Upload braucht es zuerst eine im Verein
            dokumentierte Einwilligung — bitte dafür kurz den Scout
            ansprechen, der {talent.firstName} betreut.
          </p>
        )}
      </section>
    </div>
  );
}
