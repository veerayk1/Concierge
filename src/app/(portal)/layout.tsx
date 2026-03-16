/**
 * Concierge — Portal Layout
 *
 * Sidebar (240px) on the left, main content area on the right.
 * Header at the top of the content area.
 */

import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-neutral-50">{children}</main>
      </div>
    </div>
  );
}
