import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { ImportFlow } from "@/components/import/ImportFlow";
import { DownloadErrorReportButton } from "@/components/import/DownloadErrorReportButton";
import { getImportJobs } from "@/lib/queries/importJobs";

const statusTone: Record<string, string> = {
  laeuft: "bg-amber-dim text-amber-dark",
  abgeschlossen: "bg-pitch-dim text-pitch-dark",
  fehlgeschlagen: "bg-brick-dim text-brick",
  teilweise_fehlgeschlagen: "bg-amber-dim text-amber-dark",
};

export default async function ImportPage() {
  const importHistory = await getImportJobs();
  const locale = await getLocale();
  const t = await getTranslations("importPage");

  const statusLabels: Record<string, string> = {
    laeuft: t("statusLaeuft"),
    abgeschlossen: t("statusAbgeschlossen"),
    fehlgeschlagen: t("statusFehlgeschlagen"),
    teilweise_fehlgeschlagen: t("statusTeilweiseFehlgeschlagen"),
  };

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M4 21h16" />
          </svg>
        }
      />

      <div className="animate-fade-in-up mb-8">
        <ImportFlow />
      </div>

      <section className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <h2 className="mb-3 font-display text-lg font-medium text-ink">
          {t("history")}
        </h2>
        <table className="w-full border-collapse rounded-lg border border-line bg-surface">
          <thead>
            <tr>
              <th className="th-cell">{t("file")}</th>
              <th className="th-cell">{t("date")}</th>
              <th className="th-cell">{t("status")}</th>
              <th className="th-cell">{t("rows")}</th>
              <th className="th-cell text-right">{t("errorReport")}</th>
            </tr>
          </thead>
          <tbody>
            {importHistory.length === 0 ? (
              <tr>
                <td className="td-cell text-center text-muted" colSpan={5}>
                  {t("empty")}
                </td>
              </tr>
            ) : (
              importHistory.map((job) => (
                <tr key={job.id} className="transition-colors hover:bg-pitch-dim/40">
                  <td className="td-cell">{job.sourceFilename}</td>
                  <td className="td-cell text-muted">
                    {new Date(job.startedAt).toLocaleDateString(locale)}
                  </td>
                  <td className="td-cell">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        statusTone[job.status] ?? "bg-paper text-muted"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                      {statusLabels[job.status] ?? job.status}
                    </span>
                  </td>
                  <td className="td-cell text-muted">
                    {t("rowsCount", { imported: job.importedRows, total: job.totalRows })}
                    {job.errorRows > 0 && (
                      <span className="ml-1 text-brick">
                        {t("errorRowsCount", { count: job.errorRows })}
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
