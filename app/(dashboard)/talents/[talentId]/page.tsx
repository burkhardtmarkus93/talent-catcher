import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { RiskDot } from "@/components/ui/RiskDot";
import { HiddenGemBadge } from "@/components/ui/HiddenGemBadge";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import {
  getTalentById,
  getScoutReportsForTalent,
  getOpenRemindersForTalent,
} from "@/lib/queries/talents";
import {
  archiveTalent,
  restoreTalent,
  updateExternalProfiles,
  updateTalentOverview,
  updateTalentClub,
} from "@/lib/actions/talents";
import { getGkCoordinationTestsForTalent } from "@/lib/queries/gkTests";
import { getTalentActivityStatus } from "@/lib/queries/talentActivity";
import { InactivityBanner } from "@/components/talents/InactivityBanner";
import { getCurrentAppUser } from "@/lib/queries/session";
import { TalentTags } from "@/components/talents/TalentTags";
import { getVideosForTalent } from "@/lib/queries/videos";
import { hasGrantedVideoConsent } from "@/lib/queries/consent";
import { VideoUploadForm } from "@/components/videos/VideoUploadForm";
import { getSiblingsForTalent } from "@/lib/queries/siblings";
import { addSibling, deleteSibling } from "@/lib/actions/siblings";
import { getInjuriesForTalent } from "@/lib/queries/injuries";
import { addInjury, deleteInjury } from "@/lib/actions/injuries";
import { grantVideoConsent } from "@/lib/actions/consent";

function age(birthDate: string): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return ` · ${m}:${s.toString().padStart(2, "0")} min`;
}

const TINDER_LABELS: Record<string, string> = {
  tinderTrainingssensitivitaet: "Trainingssensitivität",
  tinderIntelligenz: "Intelligenz im Spiel",
  tinderNaturell: "Naturell",
  tinderDynamik: "Dynamik",
  tinderErfolgsmotivation: "Erfolgsmotivation",
  tinderResilienz: "Resilienz",
};

export default async function TalentDetailPage({
  params,
}: {
  params: { talentId: string };
}) {
  const talent = await getTalentById(params.talentId);
  if (!talent) notFound();

  const fullName = `${talent.firstName} ${talent.lastName}`;
  const [
    reports,
    openReminders,
    gkTests,
    activityStatus,
    appUser,
    videos,
    siblings,
    injuries,
  ] = await Promise.all([
    getScoutReportsForTalent(talent.id),
    getOpenRemindersForTalent(talent.id, fullName),
    talent.primaryPosition === "TW"
      ? getGkCoordinationTestsForTalent(talent.id)
      : Promise.resolve([]),
    getTalentActivityStatus(talent.id, talent.updatedAt),
    getCurrentAppUser(),
    getVideosForTalent(talent.id),
    getSiblingsForTalent(talent.id),
    getInjuriesForTalent(talent.id),
  ]);

  const canSeeBodyData = !talent.isMinor || Boolean(appUser?.hasYouthAccess);
  const canUploadVideo = talent.isMinor
    ? await hasGrantedVideoConsent(talent.id)
    : true;

  const today = new Date().toISOString().slice(0, 10);
  const activeInjury = injuries.find(
    (i) => !i.expectedReturnDate || i.expectedReturnDate >= today
  );

  return (
    <div>
      <Link href="/talents" className="text-sm text-muted hover:underline">
        ← Zurück zur Talentliste
      </Link>

      {activityStatus.isInactive && (
        <InactivityBanner
          talentId={talent.id}
          lastActivityAt={activityStatus.lastActivityAt}
        />
      )}

      {talent.upcomingTransferClubText && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-dim px-4 py-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-none text-amber-dark" aria-hidden>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
          <div className="text-sm text-amber-dark">
            <span className="font-medium">Bevorstehender Wechsel: </span>
            zu {talent.upcomingTransferClubText}
            {talent.upcomingTransferNote && ` — ${talent.upcomingTransferNote}`}
          </div>
        </div>
      )}

      {canSeeBodyData && activeInjury && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-brick/30 bg-brick/5 px-4 py-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-none text-brick" aria-hidden>
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
          <div className="text-sm text-brick">
            <span className="font-medium">Aktuell verletzt: </span>
            {activeInjury.injuryType}
            {activeInjury.expectedReturnDate &&
              ` — Rückkehr voraussichtlich ${activeInjury.expectedReturnDate}`}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-stretch overflow-hidden rounded-xl border border-line bg-surface">
        <div
          className={`w-1.5 shrink-0 ${
            talent.currentAlert?.riskLevel === "rot"
              ? "bg-brick"
              : talent.currentAlert?.riskLevel === "gelb"
              ? "bg-amber"
              : "bg-pitch"
          }`}
          aria-hidden
        />
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-medium text-ink">
                {fullName}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {talent.primaryPosition} · {age(talent.birthDate)} Jahre ·{" "}
                {talent.clubNameText}
                {talent.teamNameText ? ` ${talent.teamNameText}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {talent.currentAlert?.isHiddenGem && <HiddenGemBadge />}
              {talent.currentAlert && (
                <RiskDot level={talent.currentAlert.riskLevel} />
              )}
            </div>
          </div>

          {talent.currentAlert && talent.currentAlert.triggeredReasons.length > 0 && (
            <div className="mt-4 rounded-lg bg-paper px-4 py-3 text-sm text-ink">
              <span className="font-medium">Begründung: </span>
              {talent.currentAlert.triggeredReasons.join(" · ")}
            </div>
          )}

          {!talent.currentAlert && (
            <p className="mt-4 text-sm text-muted">
              Noch keine Risikobewertung vorhanden (wird nach der ersten
              Neuberechnung angezeigt).
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="mb-4 font-display text-lg font-medium text-ink">
              Übersicht
            </h2>
            <form action={updateTalentOverview} className="flex flex-col gap-4 text-sm">
              <input type="hidden" name="talentId" value={talent.id} />
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5 text-ink">
                  Status
                  <select name="status" defaultValue={talent.status} className="select-field">
                    <option value="in_beobachtung">In Beobachtung</option>
                    <option value="empfehlung">Empfehlung</option>
                    <option value="abgeschlossen">Abgeschlossen</option>
                    <option value="verloren">Verloren</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-ink">
                  Sichtbarkeit
                  <select
                    name="visibilityStatus"
                    defaultValue={talent.visibilityStatus}
                    className="select-field"
                  >
                    <option value="privat">Privat</option>
                    <option value="freigegeben">Freigegeben</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-ink">
                  Vertragsstatus
                  <select
                    name="contractStatus"
                    defaultValue={talent.contractStatus}
                    className="select-field"
                  >
                    <option value="unbekannt">Unbekannt</option>
                    <option value="aktiv">Aktiv</option>
                    <option value="auslaufend">Auslaufend</option>
                    <option value="vereinslos">Vereinslos</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-ink">
                  Vertragsende
                  <input
                    type="date"
                    name="contractEndDate"
                    defaultValue={talent.contractEndDate ?? ""}
                    className="field"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-ink">
                  Liga
                  <input
                    type="text"
                    name="leagueText"
                    defaultValue={talent.leagueText ?? ""}
                    className="field"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-ink">
                  Land
                  <input
                    type="text"
                    name="countryText"
                    defaultValue={talent.countryText ?? ""}
                    className="field"
                  />
                </label>
                {canSeeBodyData && (
                  <>
                    <label className="flex flex-col gap-1.5 text-ink">
                      Größe (cm)
                      <input
                        type="number"
                        name="heightCm"
                        defaultValue={talent.heightCm ?? ""}
                        className="field"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-ink">
                      Gewicht (kg)
                      <input
                        type="number"
                        name="weightKg"
                        defaultValue={talent.weightKg ?? ""}
                        className="field"
                      />
                    </label>
                  </>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">
                    Minderjährig
                  </p>
                  <p className="mt-2 text-ink">{talent.isMinor ? "Ja" : "Nein"}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Ergibt sich automatisch aus dem Geburtsdatum.
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-muted">
                  Auswahl / Förderung
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <label className="flex items-center gap-2 text-ink">
                    <input
                      type="checkbox"
                      name="dfbStuetzpunkt"
                      defaultChecked={talent.dfbStuetzpunkt}
                    />
                    DFB-Stützpunkt
                  </label>
                  <label className="flex items-center gap-2 text-ink">
                    <input
                      type="checkbox"
                      name="verbandsauswahl"
                      defaultChecked={talent.verbandsauswahl}
                    />
                    Verbandsauswahl
                  </label>
                  <label className="flex items-center gap-2 text-ink">
                    <input
                      type="checkbox"
                      name="nationalmannschaft"
                      defaultChecked={talent.nationalmannschaft}
                    />
                    Nationalmannschaft
                  </label>
                  <label className="flex items-center gap-2 text-ink">
                    <input type="checkbox" name="nlz" defaultChecked={talent.nlz} />
                    NLZ
                  </label>
                </div>
              </div>

              <div>
                <Button type="submit" variant="secondary">
                  Speichern
                </Button>
              </div>
            </form>
          </section>

          <CollapsibleSection
            title="Talentierte Geschwister"
            meta={siblings.length > 0 ? `${siblings.length}` : undefined}
          >
            <p className="mb-4 text-xs text-muted">
              Reine Notiz für dich — z. B. wenn beim Scouting auffällt, dass
              es noch ein(e) talentierte(n) Bruder/Schwester gibt. Legt kein
              eigenes Talent-Profil an; dafür gibt es unten den Link „Als
              Talent erfassen".
            </p>

            {siblings.length === 0 ? (
              <p className="mb-4 text-sm text-muted">
                Noch keine Geschwister vermerkt.
              </p>
            ) : (
              <ul className="mb-4 divide-y divide-line">
                {siblings.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {s.firstName} {s.lastName}
                        {s.birthDate && (
                          <span className="ml-2 font-normal text-muted">
                            {age(s.birthDate)} Jahre
                          </span>
                        )}
                      </p>
                      {s.note && <p className="mt-0.5 text-sm text-muted">{s.note}</p>}
                    </div>
                    <div className="flex flex-none items-center gap-3">
                      <Link
                        href={`/talents/new?firstName=${encodeURIComponent(
                          s.firstName
                        )}&lastName=${encodeURIComponent(s.lastName)}${
                          s.birthDate ? `&birthDate=${encodeURIComponent(s.birthDate)}` : ""
                        }`}
                        className="text-sm text-pitch hover:underline"
                      >
                        Als Talent erfassen →
                      </Link>
                      <form action={deleteSibling}>
                        <input type="hidden" name="talentId" value={talent.id} />
                        <input type="hidden" name="siblingId" value={s.id} />
                        <button
                          type="submit"
                          className="text-sm text-muted hover:text-brick"
                          aria-label="Geschwister-Eintrag entfernen"
                        >
                          Entfernen
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form action={addSibling} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <input type="hidden" name="talentId" value={talent.id} />
              <label className="flex flex-col gap-1.5 text-sm text-ink">
                Vorname
                <input type="text" name="firstName" required className="field" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-ink">
                Nachname
                <input type="text" name="lastName" required className="field" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-ink">
                Geburtsdatum
                <input type="date" name="birthDate" className="field" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-ink">
                Notiz
                <input
                  type="text"
                  name="note"
                  placeholder="z. B. spielt auch bei uns in der U15"
                  className="field"
                />
              </label>
              <div className="sm:col-span-4">
                <Button type="submit" variant="secondary">
                  Geschwister hinzufügen
                </Button>
              </div>
            </form>
          </CollapsibleSection>

          <CollapsibleSection
            title="Verein & Wechsel"
            meta={
              talent.upcomingTransferClubText
                ? "Wechsel vermerkt"
                : talent.clubNameText
            }
          >
            <form action={updateTalentClub} className="flex flex-col gap-4 text-sm">
              <input type="hidden" name="talentId" value={talent.id} />
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5 text-ink">
                  Aktueller Verein
                  <input
                    type="text"
                    name="clubNameText"
                    defaultValue={talent.clubNameText ?? ""}
                    required
                    className="field"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-ink">
                  Team/Jahrgang
                  <input
                    type="text"
                    name="teamNameText"
                    defaultValue={talent.teamNameText ?? ""}
                    placeholder="z. B. U17"
                    className="field"
                  />
                </label>
              </div>

              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-muted">
                  Bevorstehender Wechsel (optional)
                </p>
                <p className="mb-3 text-xs text-muted">
                  Reine Notiz für dich selbst — z. B. um zu wissen, dass sich
                  eine Kontaktaufnahme aktuell nicht lohnt. Keine Vermittlung,
                  kein Kontakt zu Dritten.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5 text-ink">
                    Wechselt voraussichtlich zu
                    <input
                      type="text"
                      name="upcomingTransferClubText"
                      defaultValue={talent.upcomingTransferClubText ?? ""}
                      placeholder="z. B. FC Beispiel U19"
                      className="field"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-ink">
                    Notiz
                    <input
                      type="text"
                      name="upcomingTransferNote"
                      defaultValue={talent.upcomingTransferNote ?? ""}
                      placeholder="z. B. wohl ab Sommer 2027, laut Trainer bereits einig"
                      className="field"
                    />
                  </label>
                </div>
              </div>

              <div>
                <Button type="submit" variant="secondary">
                  Speichern
                </Button>
              </div>
            </form>
          </CollapsibleSection>

          <CollapsibleSection
            title="Externe Profile"
            meta={
              [talent.transfermarktUrl, talent.fupaUrl].filter(Boolean).length > 0
                ? `${[talent.transfermarktUrl, talent.fupaUrl].filter(Boolean).length} verknüpft`
                : "keins verknüpft"
            }
          >
            <p className="mb-4 text-xs text-muted">
              Nur ein Link zum jeweiligen Profil — aus rechtlichen Gründen
              (Nutzungsbedingungen der Anbieter) keine eingebetteten Daten.
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {talent.transfermarktUrl && (
                <a
                  href={talent.transfermarktUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink transition-colors hover:border-pitch"
                >
                  Transfermarkt-Profil öffnen
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <path d="M15 3h6v6" />
                    <path d="M10 14 21 3" />
                  </svg>
                </a>
              )}
              {talent.fupaUrl && (
                <a
                  href={talent.fupaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink transition-colors hover:border-pitch"
                >
                  FuPa-Profil öffnen
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <path d="M15 3h6v6" />
                    <path d="M10 14 21 3" />
                  </svg>
                </a>
              )}
              {!talent.transfermarktUrl && !talent.fupaUrl && (
                <p className="text-sm text-muted">Noch kein externes Profil verknüpft.</p>
              )}
            </div>
            <form action={updateExternalProfiles} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input type="hidden" name="talentId" value={talent.id} />
              <label className="flex flex-col gap-1.5 text-sm text-ink">
                Transfermarkt-URL
                <input
                  type="url"
                  name="transfermarktUrl"
                  defaultValue={talent.transfermarktUrl ?? ""}
                  placeholder="https://www.transfermarkt.de/..."
                  className="field"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-ink">
                FuPa-URL
                <input
                  type="url"
                  name="fupaUrl"
                  defaultValue={talent.fupaUrl ?? ""}
                  placeholder="https://www.fupa.net/..."
                  className="field"
                />
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" variant="secondary">
                  Speichern
                </Button>
              </div>
            </form>
          </CollapsibleSection>

          <CollapsibleSection
            title="Tags"
            meta={talent.tags && talent.tags.length > 0 ? `${talent.tags.length}` : undefined}
          >
            <TalentTags talentId={talent.id} tags={talent.tags ?? []} />
          </CollapsibleSection>

          <section className="mt-6 rounded-xl border border-line bg-surface p-5">
            <h2 className="mb-4 font-display text-lg font-medium text-ink">
              Berichtsverlauf
            </h2>
            {reports.length === 0 ? (
              <p className="text-sm text-muted">
                Noch keine Berichte vorhanden — der erste Bericht legt die
                Ausgangsbewertung fest.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {reports.map((r) => {
                  const tinderEntries = Object.entries(TINDER_LABELS)
                    .map(([key, label]) => ({
                      label,
                      value: (r as any)[key] as number | null | undefined,
                    }))
                    .filter((entry) => entry.value != null);

                  const hasPotenzialOrReifegrad =
                    r.potenzial != null || r.reifegrad != null;

                  return (
                    <li key={r.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-ink">
                          {r.matchDate} {r.opponent ? `vs. ${r.opponent}` : ""}
                        </span>
                        <span className="font-mono text-sm text-ink">
                          {r.overallRating.toFixed(1)}
                          {r.overallRatingSource === "manual_override" && (
                            <span className="ml-1 text-xs text-muted">(manuell)</span>
                          )}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="mt-1 text-sm text-muted">{r.comment}</p>
                      )}

                      {(tinderEntries.length > 0 || hasPotenzialOrReifegrad) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {tinderEntries.map((entry) => (
                            <span
                              key={entry.label}
                              className="inline-flex items-center gap-1 rounded-full bg-paper px-2.5 py-0.5 text-xs text-ink"
                            >
                              {entry.label}: {entry.value}/4
                            </span>
                          ))}
                          {r.potenzial != null && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2.5 py-0.5 text-xs text-ink">
                              Potenzial: {r.potenzial}/4
                            </span>
                          )}
                          {r.reifegrad != null && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2.5 py-0.5 text-xs text-ink">
                              Reifegrad: {r.reifegrad > 0 ? "+" : ""}
                              {r.reifegrad}
                            </span>
                          )}
                        </div>
                      )}

                      <p className="mt-1 text-xs text-muted">{r.authorName}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <CollapsibleSection
            title="Video-Highlights"
            meta={videos.length > 0 ? `${videos.length}` : undefined}
          >
            {videos.length === 0 ? (
              <p className="mb-4 text-sm text-muted">
                Noch keine Videos hochgeladen.
              </p>
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
                      {formatDuration(v.durationSeconds)}
                      {v.uploaderEmail && <> · {v.uploaderEmail}</>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {canUploadVideo ? (
              <VideoUploadForm talentId={talent.id} clubId={appUser?.clubId ?? ""} />
            ) : (
              <div className="flex flex-col gap-4">
                <p className="rounded-lg bg-amber-dim px-4 py-3 text-sm text-amber-dark">
                  Für dieses minderjährige Talent liegt noch keine dokumentierte
                  Einwilligung für Videomaterial vor — Upload ist deshalb
                  gesperrt.
                </p>

                {appUser?.hasYouthAccess ? (
                  <form
                    action={grantVideoConsent}
                    className="flex flex-col gap-3 rounded-lg border border-line bg-paper p-4"
                  >
                    <input type="hidden" name="talentId" value={talent.id} />
                    <p className="text-sm font-medium text-ink">
                      Einwilligung erteilen
                    </p>
                    <p className="text-xs text-muted">
                      Erst eintragen, wenn eine wirksame Einwilligung der/des
                      Erziehungsberechtigten tatsächlich vorliegt (z. B.
                      unterschriebenes Formular). Diese App speichert nur den
                      Nachweis-Vermerk, kein Dokument.
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-1.5 text-sm text-ink">
                        Gültig bis (optional)
                        <input type="date" name="validUntil" className="field" />
                      </label>
                      <label className="flex flex-col gap-1.5 text-sm text-ink">
                        Notiz
                        <input
                          type="text"
                          name="notes"
                          placeholder="z. B. schriftliches Formular liegt im Vereinsbüro vor"
                          className="field"
                        />
                      </label>
                    </div>
                    <label className="flex items-start gap-2 text-sm text-ink">
                      <input type="checkbox" name="confirmed" required className="mt-0.5" />
                      Ich bestätige, dass eine wirksame Einwilligung der/des
                      Erziehungsberechtigten für Videomaterial vorliegt.
                    </label>
                    <div>
                      <Button type="submit" variant="secondary">
                        Einwilligung erteilen
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="text-xs text-muted">
                    Eine Einwilligung kann nur ein Teammitglied mit
                    Jugendschutz-Zugriff erteilen.
                  </p>
                )}
              </div>
            )}
          </CollapsibleSection>

          {canSeeBodyData && (
            <CollapsibleSection
              title="Verletzungen"
              meta={
                activeInjury
                  ? "aktuell verletzt"
                  : injuries.length > 0
                  ? `${injuries.length}`
                  : undefined
              }
            >
              <p className="mb-4 text-xs text-muted">
                Verletzungshistorie als Beobachtungsnotiz — fließt bewusst
                nicht automatisch in die Risikobewertung ein.
              </p>

              {injuries.length === 0 ? (
                <p className="mb-4 text-sm text-muted">
                  Noch keine Verletzung vermerkt.
                </p>
              ) : (
                <ul className="mb-4 divide-y divide-line">
                  {injuries.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {i.injuryType}
                          <span className="ml-2 font-normal text-muted">
                            {i.injuryDate}
                          </span>
                        </p>
                        {i.expectedReturnDate && (
                          <p className="mt-0.5 text-sm text-muted">
                            Rückkehr voraussichtlich {i.expectedReturnDate}
                          </p>
                        )}
                        {i.note && <p className="mt-0.5 text-sm text-muted">{i.note}</p>}
                      </div>
                      <form action={deleteInjury}>
                        <input type="hidden" name="talentId" value={talent.id} />
                        <input type="hidden" name="injuryId" value={i.id} />
                        <button
                          type="submit"
                          className="flex-none text-sm text-muted hover:text-brick"
                          aria-label="Verletzungs-Eintrag entfernen"
                        >
                          Entfernen
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              <form action={addInjury} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <input type="hidden" name="talentId" value={talent.id} />
                <label className="flex flex-col gap-1.5 text-sm text-ink">
                  Art der Verletzung
                  <input
                    type="text"
                    name="injuryType"
                    placeholder="z. B. Muskelfaserriss"
                    required
                    className="field"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm text-ink">
                  Datum
                  <input type="date" name="injuryDate" required className="field" />
                </label>
                <label className="flex flex-col gap-1.5 text-sm text-ink">
                  Rückkehr voraussichtlich
                  <input type="date" name="expectedReturnDate" className="field" />
                </label>
                <label className="flex flex-col gap-1.5 text-sm text-ink">
                  Notiz
                  <input
                    type="text"
                    name="note"
                    placeholder="z. B. laut Trainer noch im Aufbautraining"
                    className="field"
                  />
                </label>
                <div className="sm:col-span-4">
                  <Button type="submit" variant="secondary">
                    Verletzung hinzufügen
                  </Button>
                </div>
              </form>
            </CollapsibleSection>
          )}

          {talent.primaryPosition === "TW" && (
            <CollapsibleSection
              title="Koordinationstest (Torhüter)"
              meta={gkTests.length > 0 ? `${gkTests.length}` : undefined}
            >
              <div className="mb-3 flex justify-end">
                <Link
                  href={`/talents/${talent.id}/gk-tests/new`}
                  className="text-sm text-pitch hover:underline"
                >
                  + Neuer Test
                </Link>
              </div>
              {gkTests.length === 0 ? (
                <p className="text-sm text-muted">
                  Noch kein Koordinationstest erfasst.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {gkTests.map((t) => (
                    <li key={t.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-ink">
                          {t.testDate} {t.ageCategory ? `· ${t.ageCategory}` : ""}
                        </span>
                        <span className="font-mono text-sm text-ink">
                          {t.totalScore ?? "—"} Pkt.
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CollapsibleSection>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Link href={`/talents/${talent.id}/reports/new`}>
              <Button className="w-full">+ Neuer Bericht</Button>
            </Link>

            {talent.archivedAt ? (
              <form action={restoreTalent}>
                <input type="hidden" name="talentId" value={talent.id} />
                <button
                  type="submit"
                  className="w-full rounded-md border border-pitch bg-emerald-50 px-4 py-2 text-sm font-medium text-pitch hover:bg-emerald-100"
                >
                  Talent wiederherstellen
                </button>
              </form>
            ) : (
              <form action={archiveTalent}>
                <input type="hidden" name="talentId" value={talent.id} />
                <button
                  type="submit"
                  className="w-full rounded-md border border-amber-500 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
                >
                  Talent archivieren
                </button>
              </form>
            )}
          </div>

          <div id="reminder-form">
            <ReminderForm talentId={talent.id} />
          </div>

          <section className="rounded-xl border border-line bg-surface p-4">
            <h2 className="mb-3 font-display text-base font-medium text-ink">
              Offene Wiedervorlagen
            </h2>
            {openReminders.length === 0 ? (
              <p className="text-sm text-muted">Keine offenen Wiedervorlagen.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {openReminders.map((reminder) => (
                  <li key={reminder.id} className="rounded-lg bg-paper p-3">
                    <p
                      className={`text-xs font-medium uppercase tracking-wide ${
                        reminder.status === "ueberfaellig" ? "text-brick" : "text-muted"
                      }`}
                    >
                      {reminder.status === "ueberfaellig" ? "Überfällig" : "Offen"} ·{" "}
                      {reminder.dueDate}
                    </p>
                    {reminder.reason && (
                      <p className="mt-1 text-sm text-ink">{reminder.reason}</p>
                    )}
                    <Link
                      href={`/talents/${talent.id}/reports/new?reminderId=${reminder.id}`}
                      className="mt-2 inline-block text-sm text-pitch hover:underline"
                    >
                      Bericht erfassen →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
