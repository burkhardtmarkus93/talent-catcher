"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";
import { parseSpreadsheet, parseDateValue } from "@/lib/import/parse";
import {
  REQUIRED_IMPORT_FIELDS,
  type ImportFieldKey,
} from "@/lib/import/fields";
import { getActiveTalentCount } from "@/lib/queries/talents";
import { PLANS } from "@/lib/plans";

const CONTRACT_STATUS_VALUES = new Set([
  "aktiv",
  "auslaufend",
  "vereinslos",
  "unbekannt",
]);

export interface ParseImportFileResult {
  success: boolean;
  error?: string;
  fileType?: "csv" | "xlsx";
  headers?: string[];
  rows?: string[][];
}

export async function parseImportFile(
  formData: FormData
): Promise<ParseImportFileResult> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Bitte eine Datei auswählen." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  const fileType = extension === "xlsx" ? "xlsx" : extension === "csv" ? "csv" : null;

  if (!fileType) {
    return {
      success: false,
      error: "Nur CSV- oder XLSX-Dateien werden unterstützt.",
    };
  }

  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId) {
    return {
      success: false,
      error: "Benutzerprofil nicht gefunden oder keinem Verein zugeordnet.",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let parsed;
  try {
    parsed = await parseSpreadsheet(buffer, fileType);
  } catch (err) {
    console.error("parseImportFile() Parsing fehlgeschlagen:", err);
    return {
      success: false,
      error: "Datei konnte nicht gelesen werden. Ist das Format korrekt?",
    };
  }

  if (parsed.headers.length === 0) {
    return { success: false, error: "Keine Spalten in der Datei gefunden." };
  }

  return {
    success: true,
    fileType,
    headers: parsed.headers,
    rows: parsed.rows,
  };
}

export interface RunImportInput {
  sourceFilename: string;
  fileType: "csv" | "xlsx";
  columnMapping: Record<string, ImportFieldKey | "">;
  headers: string[];
  rows: string[][];
}

export interface RunImportResult {
  success: boolean;
  error?: string;
  jobId?: string;
  importedRows?: number;
  errorRows?: number;
}

type RowError = { row: number; reason: string };

function calculateAge(birthDate: string): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export async function runImport(input: RunImportInput): Promise<RunImportResult> {
  const appUser = await getCurrentAppUser();

  if (!appUser?.clubId) {
    return {
      success: false,
      error: "Benutzerprofil nicht gefunden oder keinem Verein zugeordnet.",
    };
  }

  // Spaltenindex je Zielfeld, aus der Kopfzeile abgeleitet.
  const columnIndexByField = new Map<ImportFieldKey, number>();
  input.headers.forEach((header, index) => {
    const field = input.columnMapping[header];
    if (field) columnIndexByField.set(field, index);
  });

  const missingRequired = REQUIRED_IMPORT_FIELDS.filter(
    (field) => !columnIndexByField.has(field)
  );
  if (missingRequired.length > 0) {
    return {
      success: false,
      error: `Pflichtfelder nicht zugeordnet: ${missingRequired.join(", ")}.`,
    };
  }

  const supabase = await createClient();

  const { data: job, error: jobError } = await supabase
    .from("import_jobs")
    .insert({
      club_id: appUser.clubId,
      initiated_by: appUser.id,
      source_filename: input.sourceFilename,
      file_type: input.fileType,
      column_mapping: input.columnMapping,
      status: "laeuft",
      total_rows: input.rows.length,
    })
    .select("id")
    .single();

  if (jobError || !job) {
    console.error("runImport(): import_jobs-Anlage fehlgeschlagen:", jobError);
    return { success: false, error: "Import konnte nicht gestartet werden." };
  }

  const errors: RowError[] = [];
  let importedRows = 0;

  const planLimit = appUser.clubPlan ? PLANS[appUser.clubPlan]?.maxActiveTalents : null;
  let activeTalentCount =
    planLimit !== null && planLimit !== undefined
      ? await getActiveTalentCount(appUser.clubId)
      : 0;

  const get = (row: string[], field: ImportFieldKey): string => {
    const index = columnIndexByField.get(field);
    return index === undefined ? "" : (row[index] ?? "").trim();
  };

  for (let i = 0; i < input.rows.length; i++) {
    const row = input.rows[i];
    const spreadsheetRow = i + 2; // +1 Kopfzeile, +1 für 1-basierten Index

    if (planLimit !== null && planLimit !== undefined && activeTalentCount >= planLimit) {
      errors.push({
        row: spreadsheetRow,
        reason: `Plan-Limit erreicht (max. ${planLimit} aktive Talente). Bitte upgraden, um weitere Zeilen zu importieren.`,
      });
      continue;
    }

    const firstName = get(row, "firstName");
    const lastName = get(row, "lastName");
    const birthDateRaw = get(row, "birthDate");
    const primaryPosition = get(row, "primaryPosition");

    if (!firstName || !lastName || !birthDateRaw || !primaryPosition) {
      errors.push({
        row: spreadsheetRow,
        reason: "Vorname, Nachname, Geburtsdatum oder Primäre Position fehlt.",
      });
      continue;
    }

    const birthDate = parseDateValue(birthDateRaw);
    if (!birthDate) {
      errors.push({
        row: spreadsheetRow,
        reason: `Geburtsdatum „${birthDateRaw}“ nicht erkannt (erwartet: JJJJ-MM-TT oder TT.MM.JJJJ).`,
      });
      continue;
    }

    if (new Date(birthDate).getTime() > Date.now()) {
      errors.push({ row: spreadsheetRow, reason: "Geburtsdatum liegt in der Zukunft." });
      continue;
    }

    const isMinor = calculateAge(birthDate) < 18;
    if (isMinor && !appUser.hasYouthAccess) {
      errors.push({
        row: spreadsheetRow,
        reason:
          "Talent ist minderjährig, aber dein Benutzer hat keine Berechtigung „Zugriff auf Jugendtalente“.",
      });
      continue;
    }

    const contractStatusRaw = get(row, "contractStatus").toLowerCase();
    const contractStatus = CONTRACT_STATUS_VALUES.has(contractStatusRaw)
      ? contractStatusRaw
      : "unbekannt";

    const contractEndDateRaw = get(row, "contractEndDate");
    const contractEndDate = contractEndDateRaw
      ? parseDateValue(contractEndDateRaw)
      : null;

    const { data: inserted, error: insertError } = await supabase
      .from("talents")
      .insert({
        club_id: appUser.clubId,
        created_by: appUser.id,
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate,
        primary_position: primaryPosition,
        club_name_text: get(row, "clubNameText") || null,
        team_name_text: get(row, "teamNameText") || null,
        league_text: get(row, "leagueText") || null,
        contract_status: contractStatus,
        contract_end_date: contractEndDate,
      })
      .select("id, is_minor")
      .single();

    if (insertError || !inserted) {
      errors.push({
        row: spreadsheetRow,
        reason: insertError?.message ?? "Unbekannter Fehler beim Speichern.",
      });
      continue;
    }

    importedRows++;
    activeTalentCount++;

    if (inserted.is_minor) {
      const { error: consentError } = await supabase.from("consent_records").insert({
        talent_id: inserted.id,
        scope: "profil_sichtbarkeit",
        status: "angefragt",
        requested_at: new Date().toISOString(),
        recorded_by: appUser.id,
      });

      if (consentError) {
        console.error("runImport(): Consent-Anlage fehlgeschlagen:", consentError);
      }
    }
  }

  const errorRows = errors.length;
  const status =
    errorRows === 0
      ? "abgeschlossen"
      : importedRows === 0
        ? "fehlgeschlagen"
        : "teilweise_fehlgeschlagen";

  const { error: updateError } = await supabase
    .from("import_jobs")
    .update({
      imported_rows: importedRows,
      error_rows: errorRows,
      error_report: errors.length > 0 ? errors : null,
      status,
      completed_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  if (updateError) {
    console.error("runImport(): import_jobs-Abschluss fehlgeschlagen:", updateError);
  }

  revalidatePath("/import");
  revalidatePath("/dashboard");
  revalidatePath("/talents");

  return { success: true, jobId: job.id, importedRows, errorRows };
}
