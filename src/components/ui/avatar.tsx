import { forwardRef, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const avatarSizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-[13px]',
  lg: 'h-12 w-12 text-[16px]',
  xl: 'h-16 w-16 text-[20px]',
} as const;

const statusDotSizes = {
  xs: 'h-1.5 w-1.5 ring-1',
  sm: 'h-2 w-2 ring-1',
  md: 'h-2.5 w-2.5 ring-2',
  lg: 'h-3 w-3 ring-2',
  xl: 'h-3.5 w-3.5 ring-2',
} as const;

const statusColors = {
  online: 'bg-success-500',
  offline: 'bg-neutral-400',
  away: 'bg-warning-500',
  busy: 'bg-error-500',
} as const;

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'> {
  /** Image URL */
  src?: string;
  /** Display name for alt text and initials fallback */
  name?: string;
  /** Initials to display when no image is available */
  fallback?: string;
  /** Size variant */
  size?: keyof typeof avatarSizes;
  /** Online status indicator */
  status?: keyof typeof statusColors;
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return (parts[0]?.[0] ?? '').toUpperCase();
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, name, fallback, size = 'md', status, alt, ...props }, ref) => {
    const initials = fallback || (name ? getInitials(name) : '');
    const altText = alt || name || 'Avatar';

    return (
      <div ref={ref} className={cn('relative inline-flex shrink-0', className)}>
        <div
          className={cn(
            'bg-primary-100 text-primary-700 relative inline-flex items-center justify-center overflow-hidden rounded-full font-semibold',
            avatarSizes[size],
          )}
        >
          {src ? (
            <img src={src} alt={altText} className="h-full w-full object-cover" {...props} />
          ) : (
            <span aria-label={altText}>{initials}</span>
          )}
        </div>
        {status && (
          <span
            className={cn(
              'absolute right-0 bottom-0 rounded-full ring-white',
              statusDotSizes[size],
              statusColors[status],
            )}
            aria-label={status}
          />
        )}
      </div>
    );
  },
);

Avatar.displayName = 'Avatar';
