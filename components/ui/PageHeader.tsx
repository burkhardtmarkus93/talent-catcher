import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ title, subtitle, action, icon }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between border-b border-line pb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-pitch-bright to-pitch text-white shadow-sm">
            {icon}
          </span>
        )}
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
