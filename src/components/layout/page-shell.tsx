/**
 * Concierge — Page Shell
 *
 * Consistent wrapper for portal and admin pages.
 * Renders a header area with title, optional description, optional actions,
 * then children below with standard padding.
 */

import type { ReactNode } from 'react';

interface PageShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageShell({ title, description, actions, children }: PageShellProps) {
  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
          {description && <p className="text-sm text-neutral-500">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
