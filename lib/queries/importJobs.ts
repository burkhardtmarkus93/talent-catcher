import { createClient } from "@/lib/supabase/server";
import type { ImportJobPreview } from "@/lib/types";

function mapImportJob(row: any): ImportJobPreview {
  return {
    id: String(row.id),
    sourceFilename: row.source_filename ?? "Unbenannte Datei",
    status: row.status ?? "laeuft",
    totalRows: row.total_rows ?? 0,
    importedRows: row.imported_rows ?? 0,
    errorRows: row.error_rows ?? 0,
    startedAt: row.started_at,
    errorReport: Array.isArray(row.error_report) ? row.error_report : null,
  };
}

export async function getImportJobs(): Promise<ImportJobPreview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("import_jobs")
    .select("*")
    .order("started_at", { ascending: false });

  if (error) {
    console.error("getImportJobs() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Import-Historie konnte nicht geladen werden.");
  }

  return (data ?? []).map(mapImportJob);
}
