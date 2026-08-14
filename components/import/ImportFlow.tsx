"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ColumnMapper } from "@/components/import/ColumnMapper";
import { parseImportFile, runImport } from "@/lib/actions/import";
import { suggestFieldForColumn, type ImportFieldKey } from "@/lib/import/fields";

type Stage = "select" | "mapping";

export function ImportFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("select");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"csv" | "xlsx" | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, ImportFieldKey | "">>({});
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ importedRows: number; errorRows: number } | null>(
    null
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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

      <div className="mb-6 flex items-center gap-4 rounded-xl border border-line bg-surface p-5">
        <span className="text-sm text-ink">Datei auswählen (CSV/XLSX)</span>
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          disabled={parsing || submitting}
          className="text-sm"
        />
        {parsing && <span className="text-sm text-muted">Wird gelesen…</span>}
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
