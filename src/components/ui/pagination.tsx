import { forwardRef, type HTMLAttributes, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Items per page options */
  pageSizeOptions?: number[];
  /** Current page size */
  pageSize?: number;
  /** Callback when page size changes */
  onPageSizeChange?: (size: number) => void;
  /** Total item count for display */
  totalCount?: number;
  /** Show page size selector */
  showPageSize?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const ELLIPSIS = '...' as const;

function getPageRange(current: number, total: number): (number | typeof ELLIPSIS)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | typeof ELLIPSIS)[] = [1];

  if (current > 3) {
    pages.push(ELLIPSIS);
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push(ELLIPSIS);
  }

  pages.push(total);
  return pages;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export const Pagination = forwardRef<HTMLElement, PaginationProps>(
  (
    {
      className,
      currentPage,
      totalPages,
      onPageChange,
      pageSizeOptions = [10, 25, 50, 100],
      pageSize = 25,
      onPageSizeChange,
      totalCount,
      showPageSize,
      ...props
    },
    ref,
  ) => {
    const pages = useMemo(() => getPageRange(currentPage, totalPages), [currentPage, totalPages]);

    const handlePrev = useCallback(() => {
      if (currentPage > 1) onPageChange(currentPage - 1);
    }, [currentPage, onPageChange]);

    const handleNext = useCallback(() => {
      if (currentPage < totalPages) onPageChange(currentPage + 1);
    }, [currentPage, totalPages, onPageChange]);

    if (totalPages <= 1 && !showPageSize) return null;

    return (
      <nav
        ref={ref}
        aria-label="Pagination"
        className={cn('flex items-center justify-between gap-4', className)}
        {...props}
      >
        {/* Left side: count + page size */}
        <div className="flex items-center gap-4">
          {totalCount !== undefined && (
            <p className="text-[13px] text-neutral-500">
              {totalCount.toLocaleString()} {totalCount === 1 ? 'item' : 'items'}
            </p>
          )}
          {showPageSize && onPageSizeChange && (
            <div className="flex items-center gap-2">
              <label htmlFor="page-size" className="text-[13px] text-neutral-500">
                Rows per page:
              </label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="focus:ring-primary-500 h-8 rounded-md border border-neutral-300 bg-white px-2 text-[13px] focus:ring-2 focus:outline-none"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right side: page buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentPage <= 1}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-700 transition-colors',
              'focus-visible:ring-primary-500 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:outline-none',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pages.map((page, idx) =>
            page === ELLIPSIS ? (
              <span
                key={`ellipsis-${idx}`}
                className="flex h-9 w-9 items-center justify-center text-[13px] text-neutral-400"
                aria-hidden="true"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? 'page' : undefined}
                className={cn(
                  'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-[14px] font-medium transition-colors',
                  'focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
                  page === currentPage
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100',
                )}
              >
                {page}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={currentPage >= totalPages}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-700 transition-colors',
              'focus-visible:ring-primary-500 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:outline-none',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </nav>
    );
  },
);

Pagination.displayName = 'Pagination';
