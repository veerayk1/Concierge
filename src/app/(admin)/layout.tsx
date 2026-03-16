/**
 * Concierge — Admin Layout
 *
 * Same structure as the portal layout but with admin-specific navigation.
 * Sidebar on the left, header at top, content below.
 */

import type { ReactNode } from 'react';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { Header } from '@/components/layout/header';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title="Administration" />
        <main className="flex-1 overflow-y-auto bg-neutral-50">{children}</main>
      </div>
    </div>
  );
}
