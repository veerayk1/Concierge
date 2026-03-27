'use client';

/**
 * Concierge — Debug Session Provider
 *
 * Maintains a browser-side debug session context:
 * - Stable sessionId per browser tab (survives navigation, lost on tab close)
 * - Circular buffer of last 20 user actions
 * - Global reporter singleton so any hook (not just components) can report
 * - Auto-captures: window.onerror, unhandledrejection, navigation events
 * - Click tracking via document-level delegation (no PII from textContent)
 *
 * The reportEvent function is fire-and-forget — it must never throw or block.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { getAccessToken } from '@/lib/api-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActionEntry {
  type: 'click' | 'navigate' | 'form_submit' | 'api_call' | 'api_error' | 'page_focus';
  timestamp: string; // ISO 8601
  route: string; // window.location.pathname at time of action
  element?: string; // safe CSS selector (no PII)
  metadata?: Record<string, unknown>;
}

export interface DebugEventPayload {
  type: string;
  source: 'client' | 'server';
  severity?: string;
  sessionId?: string;
  requestId?: string | null;
  traceId?: string | null;
  route?: string | null;
  module?: string | null;
  title: string;
  description?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  stackTrace?: string | null;
  context?: Record<string, unknown> | null;
  actionTrail?: ActionEntry[];
  testerNote?: string | null;
  isManualFlag?: boolean;
  environment?: string;
}

interface DebugSessionContextValue {
  sessionId: string;
  getActionTrail: () => ActionEntry[];
  pushAction: (action: Omit<ActionEntry, 'timestamp' | 'route'>) => void;
  reportEvent: (event: Omit<DebugEventPayload, 'sessionId' | 'actionTrail' | 'environment'>) => void;
  isEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Module-level singleton for non-component hooks (e.g. useApi)
// ---------------------------------------------------------------------------

let _globalReporter: ((event: DebugEventPayload) => void) | null = null;

// Pre-mount queue: collects events that fire before DebugSessionProvider mounts
// (e.g. hydration errors, module-level errors). Flushed on first reporter registration.
const _preloadQueue: DebugEventPayload[] = [];

/** Called by DebugSessionProvider on mount to wire up the global reporter. */
export function setGlobalDebugReporter(fn: (event: DebugEventPayload) => void): void {
  _globalReporter = fn;
  // Flush any events that were queued before the provider mounted
  if (_preloadQueue.length > 0) {
    const queued = _preloadQueue.splice(0);
    queued.forEach((e) => fn(e));
  }
}

/** Report a debug event from anywhere — hooks, utilities, etc. Fire-and-forget. */
export function reportDebugEvent(event: DebugEventPayload): void {
  if (_globalReporter) {
    _globalReporter(event);
  } else if (_preloadQueue.length < 10) {
    // Queue up to 10 pre-mount events — avoids unbounded growth during SSR
    _preloadQueue.push(event);
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const DebugSessionContext = createContext<DebugSessionContextValue | null>(null);

export function useDebugSession(): DebugSessionContextValue | null {
  return useContext(DebugSessionContext);
}

// ---------------------------------------------------------------------------
// Selector builder (PII-safe)
// ---------------------------------------------------------------------------

const PII_INPUT_TYPES = new Set(['password', 'email', 'tel', 'ssn']);

function buildSafeSelector(target: Element): string {
  // Never capture password or sensitive input content
  if (target instanceof HTMLInputElement && PII_INPUT_TYPES.has(target.type)) {
    return `input[type=${target.type}]`;
  }
  if (target.getAttribute('data-pii') === 'true') {
    return target.tagName.toLowerCase();
  }

  const parts: string[] = [target.tagName.toLowerCase()];

  const id = target.id;
  if (id && !id.includes('pii') && id.length < 50) {
    parts.push(`#${id}`);
  }

  // Only data-* attributes (never aria-label which may have resident names)
  for (const attr of target.attributes) {
    if (attr.name.startsWith('data-') && attr.name !== 'data-pii' && attr.value.length < 30) {
      parts.push(`[${attr.name}="${attr.value}"]`);
      break; // one data attribute is enough
    }
  }

  return parts.join('').slice(0, 100);
}

// ---------------------------------------------------------------------------
// Circular buffer helpers
// ---------------------------------------------------------------------------

const BUFFER_SIZE = 20;

function createBuffer(): ActionEntry[] {
  return new Array<ActionEntry>(BUFFER_SIZE).fill(null as unknown as ActionEntry);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface DebugSessionProviderProps {
  children: ReactNode;
}

export function DebugSessionProvider({ children }: DebugSessionProviderProps) {
  const isEnabled =
    typeof window !== 'undefined' && process.env['NODE_ENV'] !== 'production';

  // Session ID — generated once per tab, stored in sessionStorage.
  // IIFE initializes synchronously on first render so sessionId is available
  // even if an error fires before the useEffect runs.
  const sessionIdRef = useRef<string>(
    typeof window !== 'undefined'
      ? (() => {
          const SESSION_KEY = 'concierge_debug_session';
          let sid = sessionStorage.getItem(SESSION_KEY);
          if (!sid) {
            sid = crypto.randomUUID();
            sessionStorage.setItem(SESSION_KEY, sid);
          }
          return sid;
        })()
      : '',
  );

  // Circular buffer
  const bufferRef = useRef<ActionEntry[]>(createBuffer());
  const headRef = useRef<number>(0);
  const countRef = useRef<number>(0);

  // ---------------------------------------------------------------------------
  // Buffer operations
  // ---------------------------------------------------------------------------

  const pushAction = useCallback((action: Omit<ActionEntry, 'timestamp' | 'route'>): void => {
    if (!isEnabled) return;
    const entry: ActionEntry = {
      ...action,
      timestamp: new Date().toISOString(),
      route: typeof window !== 'undefined' ? window.location.pathname : '/',
    };
    bufferRef.current[headRef.current] = entry;
    headRef.current = (headRef.current + 1) % BUFFER_SIZE;
    countRef.current = Math.min(countRef.current + 1, BUFFER_SIZE);
  }, [isEnabled]);

  const getActionTrail = useCallback((): ActionEntry[] => {
    if (countRef.current === 0) return [];
    const count = countRef.current;
    const head = headRef.current;
    const buf = bufferRef.current;

    // Reconstruct oldest-first ordered array
    const result: ActionEntry[] = [];
    for (let i = 0; i < count; i++) {
      const idx = ((head - count + i) % BUFFER_SIZE + BUFFER_SIZE) % BUFFER_SIZE;
      const entry = buf[idx];
      if (entry) result.push(entry);
    }
    return result;
  }, []);

  // ---------------------------------------------------------------------------
  // Reporter
  // ---------------------------------------------------------------------------

  const reportEvent = useCallback(
    (payload: Omit<DebugEventPayload, 'sessionId' | 'actionTrail' | 'environment'>): void => {
      if (!isEnabled) return;

      const fullPayload: DebugEventPayload = {
        ...payload,
        sessionId: sessionIdRef.current,
        actionTrail: getActionTrail(),
        environment: process.env['NODE_ENV'] ?? 'development',
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const authHeader = getAccessToken();
      const demoRole = typeof window !== 'undefined' ? localStorage.getItem('demo_role') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (demoRole) {
        headers['x-demo-role'] = demoRole;
      } else if (authHeader) {
        headers['Authorization'] = `Bearer ${authHeader}`;
      }

      fetch('/api/v1/debug/events', {
        method: 'POST',
        headers,
        body: JSON.stringify(fullPayload),
        signal: controller.signal,
      })
        .catch(() => {
          // Silent — debug capture must never break the app
        })
        .finally(() => clearTimeout(timeout));
    },
    [isEnabled, getActionTrail],
  );

  // ---------------------------------------------------------------------------
  // Init + event listeners
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isEnabled) return;

    // sessionId already initialized synchronously in useRef — no re-init needed here.

    // Wire up global singleton so useApi and other hooks can call reportEvent
    setGlobalDebugReporter((event) => {
      // Augment with sessionId + actionTrail if not already set
      const augmented: DebugEventPayload = {
        ...event,
        sessionId: event.sessionId ?? sessionIdRef.current,
        actionTrail: event.actionTrail ?? getActionTrail(),
        environment: event.environment ?? process.env['NODE_ENV'] ?? 'development',
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const authHeader = getAccessToken();
      const demoRoleGlobal = typeof window !== 'undefined' ? localStorage.getItem('demo_role') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (demoRoleGlobal) {
        headers['x-demo-role'] = demoRoleGlobal;
      } else if (authHeader) {
        headers['Authorization'] = `Bearer ${authHeader}`;
      }

      fetch('/api/v1/debug/events', {
        method: 'POST',
        headers,
        body: JSON.stringify(augmented),
        signal: controller.signal,
      })
        .catch(() => {})
        .finally(() => clearTimeout(timeout));
    });

    // 2. Unhandled JS errors
    const handleError = (event: ErrorEvent) => {
      reportEvent({
        type: 'FRONTEND_ERROR',
        source: 'client',
        severity: 'HIGH',
        title: event.message || 'Unhandled JavaScript error',
        errorMessage: event.message,
        stackTrace: event.error?.stack ?? null,
        route: window.location.pathname,
        module: inferModuleFromRoute(window.location.pathname),
      });
    };

    // 3. Unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error ? reason.message : String(reason ?? 'Unknown rejection');
      reportEvent({
        type: 'FRONTEND_ERROR',
        source: 'client',
        severity: 'HIGH',
        title: `Unhandled promise rejection: ${message.slice(0, 100)}`,
        errorMessage: message,
        stackTrace: reason instanceof Error ? reason.stack ?? null : null,
        route: window.location.pathname,
        module: inferModuleFromRoute(window.location.pathname),
      });
    };

    // 4. Navigation tracking
    const handlePopstate = () => {
      pushAction({ type: 'navigate' });
    };

    // 5. Click tracking (event delegation — zero component coupling)
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      const selector = buildSafeSelector(target);
      pushAction({ type: 'click', element: selector });
    };

    // 6. Page focus (tab switching)
    const handleFocus = () => {
      pushAction({ type: 'page_focus' });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('popstate', handlePopstate);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('click', handleClick, { passive: true });

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('popstate', handlePopstate);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('click', handleClick);
      // Clear global reporter on unmount
      setGlobalDebugReporter(() => {});
    };
  }, [isEnabled, pushAction, reportEvent, getActionTrail]);

  const contextValue: DebugSessionContextValue = {
    sessionId: sessionIdRef.current,
    getActionTrail,
    pushAction,
    reportEvent,
    isEnabled,
  };

  return (
    <DebugSessionContext.Provider value={contextValue}>
      {children}
    </DebugSessionContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Utility — infer module from route
// ---------------------------------------------------------------------------

/**
 * Derive the module slug from a URL pathname.
 * /packages/123 → 'packages'
 * /system/debug → 'system'
 */
export function inferModuleFromRoute(pathname: string): string {
  const clean = pathname.replace(/^\//, '');
  return clean.split('/')[0] ?? 'unknown';
}
