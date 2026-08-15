import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { RiskDot } from "@/components/ui/RiskDot";
import { HiddenGemBadge } from "@/components/ui/HiddenGemBadge";
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
} from "@/lib/actions/talents";
import { getGkCoordinationTestsForTalent } from "@/lib/queries/gkTests";
import { getTalentActivityStatus } from "@/lib/queries/talentActivity";
import { InactivityBanner } from "@/components/talents/InactivityBanner";
import { getCurrentAppUser } from "@/lib/queries/session";
import { TalentTags } from "@/components/talents/TalentTags";
import { getVideosForTalent } from "@/lib/queries/videos";
import { hasGrantedVideoConsent } from "@/lib/queries/consent";
import { VideoUploadForm } from "@/components/videos/VideoUploadForm";

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
  const [reports, openReminders, gkTests, activityStatus, appUser, videos] =
    await Promise.all([
      getScoutReportsForTalent(talent.id),
      getOpenRemindersForTalent(talent.id, fullName),
      talent.primaryPosition === "TW"
        ? getGkCoordinationTestsForTalent(talent.id)
        : Promise.resolve([]),
      getTalentActivityStatus(talent.id, talent.updatedAt),
      getCurrentAppUser(),
      getVideosForTalent(talent.id),
    ]);

  const canSeeBodyData = !talent.isMinor || Boolean(appUser?.hasYouthAccess);
  const canUploadVideo = talent.isMinor
    ? await hasGrantedVideoConsent(talent.id)
    : true;

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

          <section className="mt-6 rounded-xl border border-line bg-surface p-5">
            <h2 className="mb-1 font-display text-lg font-medium text-ink">
              Externe Profile
            </h2>
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
          </section>

          <section className="mt-6 rounded-xl border border-line bg-surface p-5">
            <h2 className="mb-3 font-display text-lg font-medium text-ink">
              Tags
            </h2>
            <TalentTags talentId={talent.id} tags={talent.tags ?? []} />
          </section>

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

          <section className="mt-6 rounded-xl border border-line bg-surface p-5">
            <h2 className="mb-4 font-display text-lg font-medium text-ink">
              Video-Highlights
            </h2>

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
              <p className="rounded-lg bg-amber-dim px-4 py-3 text-sm text-amber-dark">
                Für dieses minderjährige Talent liegt noch keine dokumentierte
                Einwilligung für Videomaterial vor — Upload ist deshalb
                gesperrt.
              </p>
            )}
          </section>

          {talent.primaryPosition === "TW" && (
            <section className="mt-6 rounded-xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-medium text-ink">
                  Koordinationstest (Torhüter)
                </h2>
                <Link
                  href={`/talents/${talent.id}/gk-tests/new`}
                  className="text-sm text-pitch hover:underline"
                >
                  + Neuer Test
                </Link>
              </div>
              {gkTests.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  Noch kein Koordinationstest erfasst.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
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
            </section>
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
