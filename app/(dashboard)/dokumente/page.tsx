import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getKoordinationstestDocUrl } from "@/lib/queries/documents";

export default async function DokumentePage() {
  const koordinationstestUrl = await getKoordinationstestDocUrl();
  const t = await getTranslations("documents");

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6" />
          </svg>
        }
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-ink">
                {t("gkTestDocTitle")}
              </h2>
              <span className="rounded-full bg-pitch-dim px-2.5 py-0.5 text-xs font-medium text-pitch-dark">
                DOCX
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">{t("gkTestDocDescription")}</p>
          </div>

          {koordinationstestUrl ? (
            <a href={koordinationstestUrl} target="_blank" rel="noreferrer">
              <Button variant="secondary">{t("download")}</Button>
            </a>
          ) : (
            <p className="text-sm text-brick">{t("unavailable")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
