import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ColumnMapper } from "@/components/import/ColumnMapper";
import { dummyImportHistory } from "@/lib/dummy-data";

const statusLabels: Record<string, string> = {
  laeuft: "Läuft",
  abgeschlossen: "Abgeschlossen",
  fehlgeschlagen: "Fehlgeschlagen",
  teilweise_fehlgeschlagen: "Teilweise fehlgeschlagen",
};

export default function ImportPage() {
  return (
    <div>
      <PageHeader
        title="Talente importieren"
        subtitle="Bestehende Scouting-Listen aus CSV/XLSX übernehmen"
      />

      <div className="mb-6 flex items-center gap-4 rounded-md border border-line bg-surface p-5">
        <span className="text-sm text-ink">Datei auswählen (CSV/XLSX)</span>
        <input type="file" accept=".csv,.xlsx" className="text-sm" />
      </div>

      <div className="mb-6">
        <ColumnMapper />
      </div>

      <div className="mb-8 flex justify-end">
        <Button>Import starten</Button>
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-medium text-ink">
          Frühere Importe
        </h2>
        <table className="w-full border-collapse rounded-sm border border-line bg-surface">
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
            {dummyImportHistory.map((job) => (
              <tr key={job.id} className="hover:bg-pitch-dim/40">
                <td className="td-cell">{job.sourceFilename}</td>
                <td className="td-cell text-muted">{job.startedAt}</td>
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
                  {job.errorRows > 0 ? (
                    <Button variant="secondary">Herunterladen</Button>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
