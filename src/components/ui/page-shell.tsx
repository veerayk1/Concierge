import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageShell({ title, description, actions, children, className }: PageShellProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-neutral-900">{title}</h1>
          {description ? <p className="mt-1 text-[14px] text-neutral-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
