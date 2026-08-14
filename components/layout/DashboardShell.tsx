import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import type { AppUser } from "@/lib/types";

export function DashboardShell({
  appUser,
  children,
}: {
  appUser: AppUser;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar email={appUser.email} role={appUser.role} />
      <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}
