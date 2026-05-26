'use client';

/**
 * AccessDeniedPanel
 *
 * Friendly read-only fallback for pages whose API rejects non-admin
 * viewers. Better than the admin chrome flashing + a generic "Failed
 * to load" error. Keeps the page shell so the back link / sidebar
 * still work.
 *
 * Use when: a page is in the route table for all signed-in users but
 * the API returns 403 for the persona's role. Wrap the main content
 * in `useHasRole(ADMIN_SET) ? <Page/> : <AccessDeniedPanel/>`.
 */

import Link from 'next/link';
import { ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccessDeniedPanelProps {
  /** What the user was trying to look at, e.g. "the vendor list". */
  resource: string;
  /** Who can see it — short phrase, e.g. "your property manager or admin". */
  whoCanSee: string;
  /** Optional home href. Defaults to /dashboard. */
  backHref?: string;
}

export function AccessDeniedPanel({
  resource,
  whoCanSee,
  backHref = '/dashboard',
}: AccessDeniedPanelProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-50 text-neutral-400 ring-1 ring-neutral-200">
        <ShieldOff className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-neutral-900">
          That&apos;s not available for your role.
        </h2>
        <p className="text-[14px] leading-relaxed text-neutral-500">
          {resource} is something {whoCanSee} would manage. If you need information from this page,
          your concierge or building manager can pull it for you.
        </p>
      </div>
      <Link href={backHref as never}>
        <Button variant="secondary" size="sm">
          Back to dashboard
        </Button>
      </Link>
    </div>
  );
}
