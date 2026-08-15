import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getCurrentAppUser } from "@/lib/queries/session";

// Bewusst außerhalb von app/(dashboard)/, aus demselben Grund wie
// app/billing/layout.tsx: das eigene Profil (u. a. Login-E-Mail) sollte
// auch nach Ablauf der Testphase einsehbar bleiben. Sonst identischer
// Auth-Check + Sidebar-Rahmen wie (dashboard)/layout.tsx.
export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    redirect("/login");
  }

  return <DashboardShell appUser={appUser}>{children}</DashboardShell>;
}
