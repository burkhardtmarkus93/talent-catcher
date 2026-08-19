"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { createVideoRecord } from "@/lib/actions/videos";

const MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024; // 150 MB, siehe check-Constraint auf videos.file_size_bytes

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function VideoUploadForm({
  talentId,
  clubId,
}: {
  talentId: string;
  clubId: string;
}) {
  const router = useRouter();
  const t = useTranslations("videoUploadForm");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    const isMp4 =
      file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4");
    if (!isMp4) {
      setError(t("onlyMp4"));
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(t("fileTooLarge"));
      return;
    }

    setUploading(true);

    // Direkt-Upload vom Browser in den privaten 'videos'-Bucket statt
    // über eine Server Action: Dateien bis 150 MB würden die Body-Size-
    // Limits von Next.js Server Actions/Vercel-Functions sprengen. RLS
    // auf storage.objects verlangt club_id als erstes Pfadsegment.
    const storageKey = `${clubId}/${talentId}/${Date.now()}-${sanitizeFilename(file.name)}`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(storageKey, file, { contentType: "video/mp4" });

    if (uploadError) {
      setUploading(false);
      setError(t("uploadFailed", { message: uploadError.message }));
      return;
    }

    const result = await createVideoRecord({
      talentId,
      storageKey,
      fileSizeBytes: file.size,
    });

    if (!result.success) {
      // Metadaten-Insert fehlgeschlagen (z. B. fehlende Einwilligung) —
      // hochgeladene Datei wieder entfernen, damit keine verwaiste Datei
      // im Bucket bleibt.
      await supabase.storage.from("videos").remove([storageKey]).catch(() => {});
      setUploading(false);
      setError(result.error ?? t("saveFailed"));
      return;
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
          {error}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,.mp4"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
          className="text-sm text-ink file:mr-3 file:rounded-lg file:border file:border-line file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink hover:file:bg-pitch-dim"
        />
        {uploading && (
          <span className="text-sm text-muted">{t("uploading")}</span>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">{t("hint")}</p>
    </div>
  );
}
