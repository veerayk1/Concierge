'use client';

/**
 * Command Palette — per PRD 15 Search & Navigation
 * Cmd+K / Ctrl+K to open. Searches across all modules.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, FileText, Megaphone, Package, Search, Shield, Users, X } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'user' | 'unit' | 'package' | 'event' | 'announcement';
  title: string;
  subtitle?: string;
  href: string;
}

const TYPE_CONFIG = {
  user: { icon: Users, label: 'User', color: 'text-primary-600', bg: 'bg-primary-50' },
  unit: { icon: Building2, label: 'Unit', color: 'text-success-600', bg: 'bg-success-50' },
  package: { icon: Package, label: 'Package', color: 'text-info-600', bg: 'bg-info-50' },
  event: { icon: Shield, label: 'Event', color: 'text-warning-600', bg: 'bg-warning-50' },
  announcement: {
    icon: Megaphone,
    label: 'Announcement',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
};

const QUICK_ACTIONS = [
  { label: 'Log Package', href: '/packages', shortcut: 'P' },
  { label: 'Log Event', href: '/security', shortcut: 'E' },
  { label: 'New Request', href: '/maintenance', shortcut: 'M' },
  { label: 'New Announcement', href: '/announcements', shortcut: 'A' },
  { label: 'Book Amenity', href: '/amenities', shortcut: 'B' },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Search debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/v1/search?propertyId=00000000-0000-4000-b000-000000000001&q=${encodeURIComponent(query)}`,
        );
        if (res.ok) {
          const data = await res.json();
          const mapped: SearchResult[] = [];

          data.data.users?.forEach(
            (u: { id: string; firstName: string; lastName: string; email: string }) => {
              mapped.push({
                id: u.id,
                type: 'user',
                title: `${u.firstName} ${u.lastName}`,
                subtitle: u.email,
                href: `/residents/${u.id}`,
              });
            },
          );
          data.data.units?.forEach((u: { id: string; number: string; status: string }) => {
            mapped.push({
              id: u.id,
              type: 'unit',
              title: `Unit ${u.number}`,
              subtitle: u.status,
              href: `/units/${u.id}`,
            });
          });
          data.data.packages?.forEach(
            (p: { id: string; referenceNumber: string; status: string }) => {
              mapped.push({
                id: p.id,
                type: 'package',
                title: p.referenceNumber,
                subtitle: p.status,
                href: `/packages/${p.id}`,
              });
            },
          );
          data.data.events?.forEach((e: { id: string; title: string; referenceNo: string }) => {
            mapped.push({
              id: e.id,
              type: 'event',
              title: e.title,
              subtitle: e.referenceNo,
              href: `/events/${e.id}`,
            });
          });
          data.data.announcements?.forEach((a: { id: string; title: string; status: string }) => {
            mapped.push({
              id: a.id,
              type: 'announcement',
              title: a.title,
              subtitle: a.status,
              href: `/announcements/${a.id}`,
            });
          });

          setResults(mapped);
        }
      } catch {
        // Silently fail — search is not critical
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = query.length >= 2 ? results : QUICK_ACTIONS;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (query.length >= 2 && results[selectedIndex]) {
          router.push(results[selectedIndex].href);
          onOpenChange(false);
        } else if (query.length < 2 && QUICK_ACTIONS[selectedIndex]) {
          router.push(QUICK_ACTIONS[selectedIndex].href);
          onOpenChange(false);
        }
      } else if (e.key === 'Escape') {
        onOpenChange(false);
      }
    },
    [query, results, selectedIndex, router, onOpenChange],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Palette */}
      <div className="relative mx-auto mt-[15vh] w-full max-w-xl">
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center border-b border-neutral-100 px-4">
            <Search className="h-5 w-5 shrink-0 text-neutral-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search anything or type a command..."
              className="h-14 w-full bg-transparent px-3 text-[16px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {loading && (
              <div className="px-4 py-8 text-center text-[14px] text-neutral-400">Searching...</div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="px-4 py-8 text-center text-[14px] text-neutral-400">
                No results for &ldquo;{query}&rdquo;
              </div>
            )}

            {!loading && query.length >= 2 && results.length > 0 && (
              <div className="flex flex-col">
                {results.map((result, i) => {
                  const config = TYPE_CONFIG[result.type];
                  const Icon = config.icon;
                  return (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => {
                        router.push(result.href);
                        onOpenChange(false);
                      }}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                        selectedIndex === i ? 'bg-primary-50' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bg}`}
                      >
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-medium text-neutral-900">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-[12px] text-neutral-500">{result.subtitle}</p>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-neutral-400">
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {query.length < 2 && (
              <div>
                <p className="px-3 py-2 text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                  Quick Actions
                </p>
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      router.push(action.href);
                      onOpenChange(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all ${
                      selectedIndex === i ? 'bg-primary-50' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <span className="text-[14px] font-medium text-neutral-700">{action.label}</span>
                    <kbd className="rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
                      {action.shortcut}
                    </kbd>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2.5">
            <div className="flex items-center gap-3 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-neutral-200 px-1 py-0.5 text-[10px]">
                  &uarr;&darr;
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-neutral-200 px-1 py-0.5 text-[10px]">
                  &crarr;
                </kbd>
                Open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-neutral-200 px-1 py-0.5 text-[10px]">Esc</kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
