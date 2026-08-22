"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { createCandidateVideoRecord } from "@/lib/actions/videos";

// Kandidaten-Gegenstück zu components/videos/VideoUploadForm.tsx —
// gleiches Pfadschema/Direkt-Upload-Prinzip, nur mit "candidate-<id>"
// statt der Talent-ID als zweitem Pfadsegment (siehe Storage-Policies in
// Migration 20260822190000).

const MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function CandidateVideoUploadForm({
  candidateId,
  clubId,
}: {
  candidateId: string;
  clubId: string;
}) {
  const router = useRouter();
  const t = useTranslations("videoUploadForm");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    const isMp4 = file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4");
    if (!isMp4) {
      setError(t("onlyMp4"));
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(t("fileTooLarge"));
      return;
    }

    setUploading(true);

    const storageKey = `${clubId}/candidate-${candidateId}/${Date.now()}-${sanitizeFilename(file.name)}`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(storageKey, file, { contentType: "video/mp4" });

    if (uploadError) {
      setUploading(false);
      setError(t("uploadFailed", { message: uploadError.message }));
      return;
    }

    const result = await createCandidateVideoRecord({
      candidateId,
      storageKey,
      fileSizeBytes: file.size,
    });

    if (!result.success) {
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
        {uploading && <span className="text-sm text-muted">{t("uploading")}</span>}
      </div>
      <p className="mt-2 text-xs text-muted">{t("hint")}</p>
    </div>
  );
}
