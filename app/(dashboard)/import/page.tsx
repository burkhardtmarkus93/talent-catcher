import { PageHeader } from "@/components/ui/PageHeader";
import { ImportFlow } from "@/components/import/ImportFlow";
import { DownloadErrorReportButton } from "@/components/import/DownloadErrorReportButton";
import { getImportJobs } from "@/lib/queries/importJobs";

const statusLabels: Record<string, string> = {
  laeuft: "Läuft",
  abgeschlossen: "Abgeschlossen",
  fehlgeschlagen: "Fehlgeschlagen",
  teilweise_fehlgeschlagen: "Teilweise fehlgeschlagen",
};

export default async function ImportPage() {
  const importHistory = await getImportJobs();

  return (
    <div>
      <PageHeader
        title="Talente importieren"
        subtitle="Bestehende Scouting-Listen aus CSV/XLSX übernehmen"
      />

      <div className="mb-8">
        <ImportFlow />
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-medium text-ink">
          Frühere Importe
        </h2>
        <table className="w-full border-collapse rounded-lg border border-line bg-surface">
          <thead>
            <tr>
              <th className="th-cell">Datei</th>
              <th className="th-cell">Datum</th>
              <th className="th-cell">Status</th>
              <th className="th-cell">Zeilen</th>
              <th className="th-cell text-right">Fehlerreport</th>
            </tr>
          </thead>
          <tbody>
            {importHistory.length === 0 ? (
              <tr>
                <td className="td-cell text-center text-muted" colSpan={5}>
                  Noch keine Importe durchgeführt.
                </td>
              </tr>
            ) : (
              importHistory.map((job) => (
                <tr key={job.id} className="hover:bg-pitch-dim/40">
                  <td className="td-cell">{job.sourceFilename}</td>
                  <td className="td-cell text-muted">
                    {new Date(job.startedAt).toLocaleDateString("de-DE")}
                  </td>
                  <td className="td-cell">{statusLabels[job.status]}</td>
                  <td className="td-cell text-muted">
                    {job.importedRows} von {job.totalRows}
                    {job.errorRows > 0 && (
                      <span className="ml-1 text-brick">
                        ({job.errorRows} fehlerhaft)
                      </span>
                    )}
                  </td>
                  <td className="td-cell text-right">
                    {job.errorRows > 0 && job.errorReport ? (
                      <DownloadErrorReportButton
                        sourceFilename={job.sourceFilename}
                        errorReport={job.errorReport}
                      />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
