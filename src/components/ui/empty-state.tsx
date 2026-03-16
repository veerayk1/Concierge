import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {icon ? <div className="text-text-tertiary mb-4">{icon}</div> : null}
      <h3 className="text-heading-sm text-text-primary font-semibold">{title}</h3>
      {description ? (
        <p className="text-body-md text-text-secondary mt-2 max-w-md">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
