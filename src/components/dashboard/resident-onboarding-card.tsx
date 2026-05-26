'use client';

/**
 * ResidentOnboardingCard
 *
 * "First-time users must never struggle." When a resident is brand new
 * they land on a dashboard cold — no orientation, no nudges, no hint
 * about the four things that actually keep them safe and reachable
 * (phone on file, emergency contact, language preference, photo).
 *
 * This card surfaces those four items as a small ticked checklist
 * with a one-tap jump to /my-account for each. It vanishes the
 * moment all four are complete so a long-time resident never sees a
 * stale "welcome" banner.
 */

import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Circle, Sparkles } from 'lucide-react';

import { useApi } from '@/lib/hooks/use-api';

interface MeResponse {
  onboarding: {
    hasPhone: boolean;
    hasAvatar: boolean;
    hasEmergencyContact: boolean;
    hasLanguagePreference: boolean;
    complete: boolean;
  } | null;
}

interface ChecklistItem {
  key: keyof Omit<NonNullable<MeResponse['onboarding']>, 'complete'>;
  label: string;
  why: string;
  href: string;
}

const ITEMS: ChecklistItem[] = [
  {
    key: 'hasPhone',
    label: 'Add a phone number',
    why: 'So the desk can reach you about a package or guest.',
    href: '/my-account',
  },
  {
    key: 'hasEmergencyContact',
    label: 'Add an emergency contact',
    why: 'Required by the building. Takes 30 seconds.',
    href: '/my-account',
  },
  {
    key: 'hasLanguagePreference',
    label: 'Pick your language',
    why: 'Notifications and emails arrive in your preferred language.',
    href: '/my-account',
  },
  {
    key: 'hasAvatar',
    label: 'Upload a profile photo',
    why: 'Helps the concierge recognize you on busy mornings.',
    href: '/my-account',
  },
];

export function ResidentOnboardingCard() {
  const router = useRouter();
  const { data: response } = useApi<MeResponse>('/api/v1/users/me');

  const onboarding =
    response && 'onboarding' in response
      ? (response as MeResponse).onboarding
      : ((response as unknown as { data?: MeResponse })?.data?.onboarding ?? null);

  if (!onboarding || onboarding.complete) return null;

  const done = ITEMS.filter((i) => onboarding[i.key]).length;
  const total = ITEMS.length;
  const percent = Math.round((done / total) * 100);
  const remaining = ITEMS.filter((i) => !onboarding[i.key]);

  return (
    <section
      className="conc-rise relative"
      style={{ animationDelay: '150ms' }}
      aria-label="Set up your account"
    >
      <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-sky-50 px-5 py-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full bg-gradient-to-br from-violet-300/30 via-indigo-300/20 to-sky-300/20 blur-2xl"
        />
        <div className="relative flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm ring-1 ring-violet-200/60 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-violet-600" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-semibold tracking-[0.1em] text-violet-700 uppercase">
                Welcome
              </span>
              <span className="text-[11.5px] text-violet-700/80">
                · {done} of {total} done · {percent}%
              </span>
            </div>
            {/* Progress bar — narrow, calm. */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-violet-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500 transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <ul className="mt-2.5 flex flex-col gap-1">
              {ITEMS.map((item) => {
                const isDone = onboarding[item.key];
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => router.push(item.href as never)}
                      disabled={isDone}
                      className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition ${
                        isDone
                          ? 'cursor-default opacity-60'
                          : 'hover:bg-white/70 hover:ring-1 hover:ring-violet-200'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-400" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-[13.5px] font-semibold ${
                            isDone ? 'text-neutral-500 line-through' : 'text-neutral-900'
                          }`}
                        >
                          {item.label}
                        </span>
                        {!isDone && (
                          <span className="text-[11.5px] text-neutral-500">{item.why}</span>
                        )}
                      </span>
                      {!isDone && (
                        <ArrowRight className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-violet-400" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            {remaining.length > 0 && (
              <p className="mt-2 text-[11.5px] text-neutral-500">
                Whole list takes under two minutes.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
