import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentAppUser } from "@/lib/queries/session";
import { signOut } from "@/lib/actions/auth";
import { LogoLockup } from "@/components/ui/LogoLockup";

// Eigener, bewusst schlanker Bereich für Eltern-Accounts — keine
// Sidebar/Talentliste/Risk-Engine-Oberfläche, nur das eigene Kind. Siehe
// Migration 20260816010000 für die Zugriffsbegründung (kein club_id,
// stattdessen talent_guardians-gescoped).
export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    redirect("/login");
  }
  if (appUser.role !== "parent") {
    redirect("/dashboard");
  }

  const t = await getTranslations("parentLayout");

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <LogoLockup height={36} />
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-muted hover:text-ink hover:underline"
            >
              {t("logout")}
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}
