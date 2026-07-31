"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";
import { signOut } from "@/lib/actions/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/talents", label: "Talente" },
  { href: "/alerts-reminders", label: "Alerts & Wiedervorlagen" },
  { href: "/watchlists", label: "Watchlists" },
  { href: "/import", label: "Import" },
];

const roleLabels: Record<Role, string> = {
  scout: "Scout",
  club_admin: "Vereinsleitung",
  admin: "Admin",
};

export function Sidebar({ email, role }: { email: string; role: Role }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="border-b border-line px-5 py-5">
        <span className="font-display text-lg font-semibold text-ink">
          Talent Catcher
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-sm px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-pitch-dim font-medium text-pitch-dark"
                  : "text-ink hover:bg-pitch-dim"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-5 py-4 text-xs text-muted">
        <div>
          Angemeldet als<br />
          <span className="font-medium text-ink">
            {roleLabels[role]} · {email}
          </span>
        </div>

        <form action={signOut} className="mt-3">
          <button
            type="submit"
            className="rounded-sm border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-pitch-dim"
          >
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
