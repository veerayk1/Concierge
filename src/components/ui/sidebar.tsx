'use client';

import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarProps {
  children: ReactNode;
  className?: string;
}

export function Sidebar({ children, className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-neutral-200 bg-white transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      <div className="flex-1 overflow-y-auto py-4">{children}</div>
      <div className="border-t border-neutral-200 p-2">
        <button
          onClick={() => {
            setCollapsed(!collapsed);
          }}
          className="flex w-full items-center justify-center rounded-md p-2 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}

export interface SidebarItemProps {
  icon?: ReactNode;
  label: string;
  href?: string;
  active?: boolean;
  className?: string;
}

export function SidebarItem({ icon, label, active, className }: SidebarItemProps) {
  return (
    <div
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors',
        active
          ? 'bg-primary-50 text-primary-600 font-medium'
          : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900',
        className,
      )}
    >
      {icon ? <span className="flex-shrink-0">{icon}</span> : null}
      <span className="truncate">{label}</span>
    </div>
  );
}
