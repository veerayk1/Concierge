/**
 * Concierge — Top Header Bar
 *
 * Displays the current page title on the left and quick actions
 * (notification bell, user avatar) on the right.
 * White background with bottom border per design system.
 */

import { Bell, CircleUser } from 'lucide-react';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-8">
      {/* Page Title */}
      <h1 className="text-lg font-semibold text-neutral-900">{title ?? 'Concierge'}</h1>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-600"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        <button
          type="button"
          className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-600"
          aria-label="Account menu"
        >
          <CircleUser className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
