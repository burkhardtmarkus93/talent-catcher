import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { getCurrentAppUser } from "@/lib/queries/session";

// Zweite Schutzschicht zusätzlich zur Middleware (Defense-in-Depth,
// siehe technischer Umsetzungsplan): selbst wenn die Middleware aus
// irgendeinem Grund nicht greift, blockiert dieses Layout serverseitig
// jeden Zugriff ohne gültige Session und ohne passendes users-Profil.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar email={appUser.email} role={appUser.role} />
      <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}
