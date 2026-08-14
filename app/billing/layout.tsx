import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getCurrentAppUser } from "@/lib/queries/session";

// Bewusst außerhalb von app/(dashboard)/: dessen Layout leitet nach
// Ablauf der Testphase auf /billing um (Trial-Gate) — läge diese Seite
// selbst in derselben Route-Gruppe, entstünde eine Redirect-Schleife.
// Sonst identischer Auth-Check + Sidebar-Rahmen wie (dashboard)/layout.tsx.
export default async function BillingLayout({
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
