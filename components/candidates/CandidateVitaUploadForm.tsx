"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { createCandidateDocumentRecord } from "@/lib/actions/candidateDocuments";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB, reicht für ein PDF/DOCX bei weitem

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function fileTypeFor(file: File): "pdf" | "docx" | "other" {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return "docx";
  }
  return "other";
}

export function CandidateVitaUploadForm({
  candidateId,
  clubId,
}: {
  candidateId: string;
  clubId: string;
}) {
  const router = useRouter();
  const t = useTranslations("candidateVitaUploadForm");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    const fileType = fileTypeFor(file);
    if (fileType === "other") {
      setError(t("onlyPdfDocx"));
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(t("fileTooLarge"));
      return;
    }

    setUploading(true);

    // Gleiches Prinzip wie beim Video: Direkt-Upload vom Browser in den
    // privaten 'documents'-Bucket, RLS verlangt club_id als erstes
    // Pfadsegment (siehe Migration 20260822190000).
    const storageKey = `${clubId}/candidate-${candidateId}/${Date.now()}-${sanitizeFilename(file.name)}`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storageKey, file, { contentType: file.type || undefined });

    if (uploadError) {
      setUploading(false);
      setError(t("uploadFailed", { message: uploadError.message }));
      return;
    }

    const result = await createCandidateDocumentRecord({
      candidateId,
      storageKey,
      fileType,
      fileSizeBytes: file.size,
    });

    if (!result.success) {
      await supabase.storage.from("documents").remove([storageKey]).catch(() => {});
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
          accept="application/pdf,.pdf,.docx"
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
