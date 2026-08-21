import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { getCurrentAppUser } from "@/lib/queries/session";
import { signOut } from "@/lib/actions/auth";
import { LogoLockup } from "@/components/ui/LogoLockup";

// Eigener, bewusst schlanker Bereich für Landesverbands-Accounts — keine
// Sidebar/Scout-Berichte/Risikobewertung, nur die freigegebenen
// Basisprofile der zugeordneten Vereine. Siehe Migration 20260819100000
// für die Zugriffsbegründung (kein club_id, stattdessen
// landesverband_id-gescoped über clubs.landesverband_id).
export default async function VerbandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    redirect("/login");
  }
  if (appUser.role !== "landesverband") {
    redirect("/dashboard");
  }

  const t = await getTranslations("verbandLayout");

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
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
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
      <footer className="mx-auto max-w-4xl px-6 pb-8 text-center text-xs text-muted">
        <Link href="/impressum" className="underline-offset-2 hover:underline">
          {t("impressumLink")}
        </Link>
        {" · "}
        <Link href="/datenschutz" className="underline-offset-2 hover:underline">
          {t("privacyLink")}
        </Link>
      </footer>
    </div>
  );
}
