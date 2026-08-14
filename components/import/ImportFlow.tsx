"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ColumnMapper } from "@/components/import/ColumnMapper";
import { parseImportFile, runImport } from "@/lib/actions/import";
import { suggestFieldForColumn, type ImportFieldKey } from "@/lib/import/fields";

type Stage = "select" | "mapping";

export function ImportFlow() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("select");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"csv" | "xlsx" | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, ImportFieldKey | "">>({});
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ importedRows: number; errorRows: number } | null>(
    null
  );

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setParsing(true);

    const formData = new FormData();
    formData.set("file", file);

    const parsed = await parseImportFile(formData);
    setParsing(false);

    if (!parsed.success || !parsed.headers || !parsed.rows || !parsed.fileType) {
      setError(parsed.error ?? "Datei konnte nicht gelesen werden.");
      return;
    }

    const initialMapping: Record<string, ImportFieldKey | ""> = {};
    parsed.headers.forEach((header) => {
      initialMapping[header] = suggestFieldForColumn(header);
    });

    setFileName(file.name);
    setFileType(parsed.fileType);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setMapping(initialMapping);
    setStage("mapping");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (parsing || submitting) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  async function handleImport() {
    if (!fileType) return;

    setSubmitting(true);
    setError(null);

    const res = await runImport({
      sourceFilename: fileName,
      fileType,
      columnMapping: mapping,
      headers,
      rows,
    });

    setSubmitting(false);

    if (!res.success) {
      setError(res.error ?? "Import fehlgeschlagen.");
      return;
    }

    setResult({ importedRows: res.importedRows ?? 0, errorRows: res.errorRows ?? 0 });
    setStage("select");
    setHeaders([]);
    setRows([]);
    setMapping({});
    router.refresh();
  }

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
          {error}
        </div>
      )}

      {result && (
        <div className="mb-6 rounded-lg border border-pitch/30 bg-pitch/5 px-3 py-2 text-sm text-pitch">
          Import abgeschlossen: {result.importedRows} Talente importiert
          {result.errorRows > 0 && `, ${result.errorRows} Zeilen mit Fehlern`}.
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!parsing && !submitting) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !parsing && !submitting && inputRef.current?.click()}
        className={`mb-6 flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-all duration-150 ${
          dragging
            ? "border-pitch bg-pitch-dim/60"
            : "border-line bg-surface hover:border-pitch/50 hover:bg-pitch-dim/20"
        } ${parsing || submitting ? "pointer-events-none opacity-60" : ""}`}
      >
        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-gradient-to-br from-pitch-bright to-pitch text-white shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M4 21h16" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-medium text-ink">
            {fileName || "Datei hierher ziehen oder klicken zum Auswählen"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {parsing ? "Wird gelesen…" : "CSV oder XLSX"}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          disabled={parsing || submitting}
          className="hidden"
        />
      </div>

      {stage === "mapping" && headers.length > 0 && (
        <>
          <div className="mb-6">
            <ColumnMapper
              headers={headers}
              mapping={mapping}
              onChange={(column, field) =>
                setMapping((prev) => ({ ...prev, [column]: field }))
              }
            />
          </div>

          <div className="mb-8 flex items-center justify-end gap-3">
            <span className="text-sm text-muted">{rows.length} Zeilen erkannt</span>
            <Button onClick={handleImport} disabled={submitting}>
              {submitting ? "Import läuft…" : "Import starten"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
