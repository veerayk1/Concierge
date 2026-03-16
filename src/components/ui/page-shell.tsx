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
          <h1 className="text-heading-lg text-text-primary font-semibold">{title}</h1>
          {description ? (
            <p className="text-body-md text-text-secondary mt-1">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
