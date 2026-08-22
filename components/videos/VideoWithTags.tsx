"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { addVideoTag, deleteVideoTag } from "@/lib/actions/videoTags";
import type { TalentVideo } from "@/lib/queries/videos";

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Zeitmarken auf Video-Highlights (Migration 20260823110000): Klick auf
// eine Markierung springt im Video an die Stelle, "Bei aktueller Position
// markieren" liest die Zeit direkt aus dem <video>-Element statt einer
// eigenen Zeit-Eingabe — für Scouts beim Durchschauen einer Aufnahme der
// naheliegendere Ablauf als eine mm:ss-Eingabe von Hand.
export function VideoWithTags({
  video,
  talentId,
  canManageTags,
  currentUserEmail,
  metaLine,
  videoUnavailableLabel,
}: {
  video: TalentVideo;
  talentId: string;
  canManageTags: boolean;
  currentUserEmail: string | null;
  metaLine: string;
  videoUnavailableLabel: string;
}) {
  const router = useRouter();
  const t = useTranslations("videoTags");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [label, setLabel] = useState("");
  const [pending, setPending] = useState(false);

  function seekTo(seconds: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      void videoRef.current.play();
    }
  }

  async function handleAddTag() {
    const trimmed = label.trim();
    if (!videoRef.current || !trimmed) return;

    const timestampSeconds = Math.floor(videoRef.current.currentTime);
    setPending(true);
    await addVideoTag(video.id, talentId, timestampSeconds, trimmed);
    setLabel("");
    setPending(false);
    router.refresh();
  }

  async function handleDeleteTag(tagId: string) {
    setPending(true);
    await deleteVideoTag(tagId, talentId);
    setPending(false);
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-paper">
      {video.playbackUrl ? (
        <video
          ref={videoRef}
          controls
          className="aspect-video w-full bg-black"
          preload="metadata"
        >
          <source src={video.playbackUrl} type="video/mp4" />
        </video>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-ink/5 text-xs text-muted">
          {videoUnavailableLabel}
        </div>
      )}

      <div className="px-3 py-2 text-xs text-muted">{metaLine}</div>

      {video.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 px-3 pb-2">
          {video.tags.map((tag) => (
            <li key={tag.id} className="group inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => seekTo(tag.timestampSeconds)}
                disabled={!video.playbackUrl}
                className="inline-flex items-center gap-1 rounded-full bg-pitch-dim px-2.5 py-0.5 text-xs text-pitch-dark hover:bg-pitch-dim/70 disabled:cursor-default disabled:opacity-60"
              >
                <span className="font-mono">{formatTimestamp(tag.timestampSeconds)}</span>
                <span>{tag.label}</span>
              </button>
              {canManageTags && tag.createdByEmail === currentUserEmail && (
                <button
                  type="button"
                  onClick={() => handleDeleteTag(tag.id)}
                  disabled={pending}
                  aria-label={t("deleteTag")}
                  className="text-xs text-muted opacity-0 hover:text-brick group-hover:opacity-100"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManageTags && video.playbackUrl && (
        <div className="flex items-center gap-2 border-t border-line px-3 py-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("labelPlaceholder")}
            className="field flex-1 py-1 text-xs"
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={pending || !label.trim()}
            className="whitespace-nowrap rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-pitch-dim disabled:opacity-50"
          >
            {t("markAtCurrentTime")}
          </button>
        </div>
      )}
    </div>
  );
}
