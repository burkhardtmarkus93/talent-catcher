import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { NewTalentForm } from "@/components/talents/NewTalentForm";

export default async function NewTalentPage() {
  const t = await getTranslations("newTalentPage");
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/talents" className="text-sm text-muted hover:underline">
        {t("backToList")}
      </Link>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <path d="M20 8v6" />
            <path d="M23 11h-6" />
          </svg>
        }
      />
      <NewTalentForm />
    </div>
  );
}
