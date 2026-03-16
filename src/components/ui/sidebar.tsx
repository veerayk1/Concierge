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
        'border-border-primary bg-surface-primary flex h-full flex-col border-r transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      <div className="flex-1 overflow-y-auto py-4">{children}</div>
      <div className="border-border-primary border-t p-2">
        <button
          onClick={() => {
            setCollapsed(!collapsed);
          }}
          className="text-text-tertiary hover:bg-surface-secondary hover:text-text-primary flex w-full items-center justify-center rounded-md p-2"
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
        'text-body-sm flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors',
        active
          ? 'bg-interactive-primary/10 text-interactive-primary font-medium'
          : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary',
        className,
      )}
    >
      {icon ? <span className="flex-shrink-0">{icon}</span> : null}
      <span className="truncate">{label}</span>
    </div>
  );
}
