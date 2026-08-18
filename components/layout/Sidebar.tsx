"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Role } from "@/lib/types";
import { signOut } from "@/lib/actions/auth";
import { LogoLockup } from "@/components/ui/LogoLockup";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { startIntroTour } from "@/components/tour/ProductTour";

const navItems = [
  {
    href: "/dashboard",
    labelKey: "dashboard" as const,
    icon: (
      <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z" />
    ),
  },
  {
    href: "/talents",
    labelKey: "talents" as const,
    tourId: "tour-nav-talente",
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    href: "/alerts-reminders",
    labelKey: "alerts" as const,
    tourId: "tour-nav-alerts",
    icon: (
      <>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </>
    ),
  },
  {
    href: "/watchlists",
    labelKey: "watchlists" as const,
    tourId: "tour-nav-watchlists",
    icon: <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />,
  },
  {
    href: "/import",
    labelKey: "import" as const,
    tourId: "tour-nav-import",
    icon: (
      <>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M4 21h16" />
      </>
    ),
  },
  {
    href: "/billing",
    labelKey: "billing" as const,
    tourId: "tour-nav-abo",
    icon: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </>
    ),
  },
  {
    href: "/admin",
    labelKey: "admin" as const,
    tourId: "tour-nav-verwaltung",
    adminOnly: true,
    icon: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),
  },
];

export function Sidebar({ email, role }: { email: string; role: Role }) {
  const pathname = usePathname();
  const t = useTranslations("sidebar");
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex items-center justify-center border-b border-line px-5 py-4">
        <LogoLockup height={72} />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems
          .filter((item) => !item.adminOnly || role === "admin")
          .map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour-id={item.tourId}
              className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
                active
                  ? "bg-pitch-dim font-medium text-pitch-dark"
                  : "text-ink hover:translate-x-0.5 hover:bg-pitch-dim/60"
              }`}
            >
              <span
                className={`absolute -left-3 h-4 w-1 rounded-full bg-pitch transition-transform duration-150 ${
                  active ? "scale-y-100" : "scale-y-0"
                }`}
                aria-hidden
              />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className={`flex-none transition-transform duration-150 ${
                  active ? "text-pitch-dark" : "text-muted group-hover:text-pitch"
                } group-hover:scale-110`}
              >
                {item.icon}
              </svg>
              {t(`nav.${item.labelKey}`)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <LanguageSwitcher className="mb-2" />

        <button
          type="button"
          onClick={() => startIntroTour()}
          className="mb-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-pitch-dim hover:text-pitch-dark"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 1.7-2.4 3.2" />
            <path d="M12 17h.01" />
          </svg>
          {t("introTour")}
        </button>

        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-pitch-dim/50"
        >
          <span className="relative flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-pitch-bright to-pitch text-xs font-semibold text-white shadow-sm">
            {initials}
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-surface bg-pitch-bright"
              aria-hidden
              title="Angemeldet"
            />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">
              {t(`roles.${role}`)}
            </p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>
        </Link>

        <form action={signOut} className="mt-2">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brick/40 hover:bg-brick-dim hover:text-brick"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            {t("logout")}
          </button>
        </form>
      </div>
    </aside>
  );
}
