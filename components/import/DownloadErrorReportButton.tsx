"use client";

import { Button } from "@/components/ui/Button";

interface DownloadErrorReportButtonProps {
  sourceFilename: string;
  errorReport: { row: number; reason: string }[];
}

export function DownloadErrorReportButton({
  sourceFilename,
  errorReport,
}: DownloadErrorReportButtonProps) {
  function handleDownload() {
    const header = "Zeile;Fehler\n";
    const body = errorReport
      .map((e) => `${e.row};"${e.reason.replace(/"/g, '""')}"`)
      .join("\n");

    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fehlerreport_${sourceFilename.replace(/\.[^.]+$/, "")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="secondary" onClick={handleDownload}>
      Herunterladen
    </Button>
  );
}
