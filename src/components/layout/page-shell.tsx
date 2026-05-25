import type { ReactNode } from 'react';

interface PageShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  /**
   * Optional palette for the soft gradient wash behind the H1. Each
   * resident-facing module has its own colour identity so a glance at the
   * hero tells the resident which area they're in.
   *
   * Defaults to "none" — staff pages keep the bone-white treatment unless
   * they opt in.
   */
  hero?: 'amber' | 'emerald' | 'sky' | 'violet' | 'rose' | 'none';
}

const HERO_GRADIENT: Record<NonNullable<PageShellProps['hero']>, string> = {
  amber:
    'before:bg-[radial-gradient(60%_70%_at_25%_30%,rgba(254,215,170,0.45)_0%,transparent_65%),radial-gradient(45%_60%_at_85%_15%,rgba(254,205,211,0.4)_0%,transparent_60%)]',
  emerald:
    'before:bg-[radial-gradient(60%_70%_at_25%_30%,rgba(167,243,208,0.45)_0%,transparent_65%),radial-gradient(45%_60%_at_85%_15%,rgba(186,230,253,0.4)_0%,transparent_60%)]',
  sky: 'before:bg-[radial-gradient(60%_70%_at_25%_30%,rgba(186,230,253,0.5)_0%,transparent_65%),radial-gradient(45%_60%_at_85%_15%,rgba(199,210,254,0.42)_0%,transparent_60%)]',
  violet:
    'before:bg-[radial-gradient(60%_70%_at_25%_30%,rgba(221,214,254,0.5)_0%,transparent_65%),radial-gradient(45%_60%_at_85%_15%,rgba(251,207,232,0.4)_0%,transparent_60%)]',
  rose: 'before:bg-[radial-gradient(60%_70%_at_25%_30%,rgba(254,205,211,0.5)_0%,transparent_65%),radial-gradient(45%_60%_at_85%_15%,rgba(254,215,170,0.42)_0%,transparent_60%)]',
  none: '',
};

export function PageShell({
  title,
  description,
  actions,
  children,
  hero = 'none',
}: PageShellProps) {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Header — opt-in radial gradient wash via the `hero` prop. The
          wash sits behind the H1 (z-index 0) and is blurred + low-alpha
          so the heading stays crisp. The animation class conc-rise gives
          the whole header a 520ms fade-up on first paint. */}
      <header
        className={`conc-rise relative isolate flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${
          hero !== 'none'
            ? `before:absolute before:inset-x-[-30%] before:-top-10 before:h-[260px] before:rounded-full before:blur-sm before:content-[''] ${HERO_GRADIENT[hero]} before:pointer-events-none before:-z-10`
            : ''
        }`}
      >
        <div className="relative flex flex-col gap-1">
          <h1 className="text-[24px] font-bold tracking-tight text-neutral-900 md:text-[28px]">
            {title}
          </h1>
          {description && (
            <p className="text-[14px] leading-relaxed text-neutral-500 md:text-[15px]">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="relative flex shrink-0 items-center gap-3">{actions}</div>}
      </header>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
