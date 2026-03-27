/**
 * Concierge — Debugging Intelligence Layer
 *
 * Captures, stores, and queries structured debug events to preserve
 * engineering-grade context during active development and testing.
 *
 * This is NOT a compliance system — events are purgeable and not GDPR-bound.
 * It is separate from AuditEntry (compliance) and the Pino logger (runtime logs).
 *
 * Design principles:
 * - Never throws — debug capture must not break request handling
 * - Fire-and-forget from call sites
 * - PII-sanitized before storage
 * - Deduplication via fingerprint (sha256 hash) to prevent write floods
 */

import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { createLogger } from '@/server/logger';
import { sanitizeForLog } from '@/server/middleware/log-sanitizer';
import type { TokenPayload } from '@/types';
import type { DebugEvent, DebugEventType, DebugSeverity, DebugEventStatus } from '@prisma/client';

const logger = createLogger('debug-intelligence');

// ---------------------------------------------------------------------------
// Environment guard
// ---------------------------------------------------------------------------

function isCaptureEnabled(): boolean {
  const enabled = process.env['DEBUG_CAPTURE_ENABLED'];
  // Default: enabled in dev/test, disabled in production unless explicitly set
  if (enabled === 'false') return false;
  if (enabled === 'true') return true;
  return process.env['NODE_ENV'] !== 'production';
}

function getSampleRate(): number {
  const rate = parseFloat(process.env['DEBUG_CAPTURE_SAMPLE_RATE'] ?? '1.0');
  return isNaN(rate) ? 1.0 : Math.min(1.0, Math.max(0, rate));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateDebugEventInput {
  type: DebugEventType;
  source: 'client' | 'server';
  severity?: DebugSeverity;

  // Correlation
  sessionId?: string | null;
  requestId?: string | null;
  traceId?: string | null;

  // Who / where
  userId?: string | null;
  propertyId?: string | null;
  userRole?: string | null;
  route?: string | null;
  module?: string | null;

  // What happened
  title: string;
  description?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  stackTrace?: string | null;

  // Rich context
  context?: Record<string, unknown> | null;
  actionTrail?: unknown[] | null;

  // Tester annotation
  testerNote?: string | null;
  isManualFlag?: boolean;

  environment?: string;
}

export interface DebugEventFilters {
  severity?: DebugSeverity;
  module?: string;
  status?: DebugEventStatus;
  sessionId?: string;
  requestId?: string;
  fingerprint?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

export interface DebugEventWithCorrelations {
  event: DebugEvent;
  correlatedByRequest: DebugEvent[];
  correlatedBySession: DebugEvent[];
  fingerprintGroup: DebugEvent[];
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Fingerprint
// ---------------------------------------------------------------------------

/**
 * Compute a deduplication fingerprint from the error's key identifiers.
 * sha256(errorCode|route|errorMessage[:50])[:64]
 */
export function computeFingerprint(
  errorCode: string | null | undefined,
  route: string | null | undefined,
  errorMessage: string | null | undefined,
): string {
  const normalized = [
    (errorCode ?? 'unknown').toLowerCase(),
    (route ?? '/').toLowerCase(),
    (errorMessage ?? '').slice(0, 50).toLowerCase(),
  ].join('|');

  return createHash('sha256').update(normalized).digest('hex').slice(0, 64);
}

/**
 * Check if a fingerprint already exists within the dedup window.
 * Returns the id of the existing OPEN event, or null if not found.
 */
export async function findDuplicateByFingerprint(
  fingerprint: string,
  windowHours = 24,
): Promise<string | null> {
  try {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const existing = await prisma.debugEvent.findFirst({
      where: {
        fingerprint,
        status: { not: 'DUPLICATE' },
        createdAt: { gte: since },
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    return existing?.id ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Auto-severity assignment
// ---------------------------------------------------------------------------

function autoSeverity(
  type: DebugEventType,
  errorCode?: string | null,
  isOperational = true,
): DebugSeverity {
  if (type === 'AUTH_ANOMALY') return 'CRITICAL';
  if (type === 'FRONTEND_ERROR') return 'HIGH';
  if (type === 'API_ERROR') return isOperational ? 'HIGH' : 'CRITICAL';
  if (type === 'VALIDATION_ERROR') return 'MEDIUM';
  if (type === 'PERFORMANCE_ANOMALY') return 'LOW';
  if (type === 'MANUAL_BUG_REPORT') return 'HIGH';
  if (type === 'WORKFLOW_BREAK') return 'HIGH';
  if (type === 'STATE_INCONSISTENCY') return 'MEDIUM';
  return 'MEDIUM';
}

// ---------------------------------------------------------------------------
// Request body summariser
// ---------------------------------------------------------------------------

/**
 * Produce a safe, truncated summary of the parsed request body.
 * - Uses existing sanitizeForLog for PII redaction
 * - Truncates string values to 50 chars
 * - Replaces arrays with "[N items]"
 */
function summariseBody(body: unknown): unknown {
  if (body === null || body === undefined) return undefined;

  const sanitized = sanitizeForLog(body);

  function truncate(val: unknown): unknown {
    if (typeof val === 'string') return val.slice(0, 50);
    if (Array.isArray(val)) return `[${val.length} items]`;
    if (val !== null && typeof val === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        result[k] = truncate(v);
      }
      return result;
    }
    return val;
  }

  return truncate(sanitized);
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a DebugEvent row.
 *
 * - Never throws — swallows all errors (debug must not break requests)
 * - Applies sampling and environment guards
 * - Deduplicates via fingerprint
 *
 * Returns the new event id, or null on failure.
 */
export async function createDebugEvent(input: CreateDebugEventInput): Promise<string | null> {
  if (!isCaptureEnabled()) return null;

  // Sampling gate (useful for high-traffic production)
  const sampleRate = getSampleRate();
  if (sampleRate < 1.0 && Math.random() > sampleRate) return null;

  try {
    const fingerprint = computeFingerprint(input.errorCode, input.route, input.errorMessage);

    // Deduplication check
    let status: DebugEventStatus = 'OPEN';
    let duplicateOf: string | null = null;

    const existingId = await findDuplicateByFingerprint(fingerprint);
    if (existingId) {
      status = 'DUPLICATE';
      duplicateOf = existingId;
    }

    const severity: DebugSeverity =
      input.severity ?? autoSeverity(input.type, input.errorCode);

    // Sanitize context JSONB
    const safeContext = input.context ? (sanitizeForLog(input.context) as Record<string, unknown>) : null;

    // Stack trace only in non-production
    const stackTrace =
      process.env['NODE_ENV'] !== 'production' ? input.stackTrace ?? null : null;

    const event = await prisma.debugEvent.create({
      data: {
        type: input.type,
        severity,
        source: input.source,
        sessionId: input.sessionId ?? null,
        requestId: input.requestId ?? null,
        traceId: input.traceId ?? null,
        userId: input.userId ?? null,
        propertyId: input.propertyId ?? null,
        userRole: input.userRole ?? null,
        route: input.route ? input.route.slice(0, 500) : null,
        module: input.module ? input.module.slice(0, 50) : null,
        title: input.title.slice(0, 200),
        description: input.description ?? null,
        errorCode: input.errorCode ? input.errorCode.slice(0, 100) : null,
        errorMessage: input.errorMessage ?? null,
        stackTrace,
        context: safeContext ? (safeContext as Prisma.InputJsonValue) : undefined,
        actionTrail: input.actionTrail ? (input.actionTrail as Prisma.InputJsonValue) : undefined,
        fingerprint,
        testerNote: input.testerNote ?? null,
        isManualFlag: input.isManualFlag ?? false,
        status,
        duplicateOf,
        environment: input.environment ?? process.env['NODE_ENV'] ?? 'development',
      },
      select: { id: true },
    });

    return event.id;
  } catch (err) {
    logger.warn({ err }, 'Failed to create debug event (non-fatal)');
    return null;
  }
}

// ---------------------------------------------------------------------------
// Server-side capture (called from middleware chain)
// ---------------------------------------------------------------------------

interface ServerCaptureInput {
  error: unknown;
  status: number;
  errorCode: string;
  requestId: string;
  token: TokenPayload | null;
  req: NextRequest;
  parsedBody?: unknown;
}

/**
 * Called from the API middleware chain catch block.
 * Only captures 5xx errors and validation errors (400).
 * Skips 401, 403, 404, 429 — expected behaviors.
 * Has a hard recursion guard for /api/v1/debug paths.
 */
export async function captureServerDebugEvent(input: ServerCaptureInput): Promise<void> {
  // Recursion guard — prevents infinite loop if debug endpoint itself errors
  if (input.req.nextUrl.pathname.startsWith('/api/v1/debug')) return;

  // Only capture 5xx and validation (400) errors
  const { status } = input;
  if (status === 401 || status === 403 || status === 404 || status === 429) return;
  if (status < 400) return;
  if (status === 400 && input.errorCode !== 'VALIDATION_ERROR') return;

  const error = input.error as { isOperational?: boolean; message?: string; stack?: string };
  const isOperational = error?.isOperational !== false;

  const type: DebugEventType = status >= 500 ? 'API_ERROR' : 'VALIDATION_ERROR';
  const module = inferModuleFromPath(input.req.nextUrl.pathname);

  const context: Record<string, unknown> = {
    httpMethod: input.req.method,
    responseStatus: status,
  };

  // Include sanitized body summary for server-side events
  if (input.parsedBody !== undefined) {
    context['requestBodySummary'] = summariseBody(input.parsedBody);
  }

  await createDebugEvent({
    type,
    source: 'server',
    severity: type === 'API_ERROR' && !isOperational ? 'CRITICAL' : undefined,
    requestId: input.requestId,
    userId: input.token?.sub ?? null,
    propertyId: input.token?.pid ?? null,
    userRole: input.token?.role ?? null,
    route: input.req.nextUrl.pathname,
    module,
    title: `${input.req.method} ${input.req.nextUrl.pathname} → ${status}`,
    errorCode: input.errorCode,
    errorMessage: error?.message ?? null,
    stackTrace: error?.stack ?? null,
    context,
  });
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

/**
 * Query debug events with filters and pagination.
 * Super Admin access only — enforced at the API route level.
 */
export async function queryDebugEvents(filters: DebugEventFilters = {}): Promise<{
  data: DebugEvent[];
  meta: PaginationMeta;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 50));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (filters.severity) where['severity'] = filters.severity;
  if (filters.module) where['module'] = filters.module;
  if (filters.status) where['status'] = filters.status;
  if (filters.sessionId) where['sessionId'] = filters.sessionId;
  if (filters.requestId) where['requestId'] = filters.requestId;
  if (filters.fingerprint) where['fingerprint'] = filters.fingerprint;

  if (filters.dateFrom || filters.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (filters.dateFrom) createdAt['gte'] = filters.dateFrom;
    if (filters.dateTo) createdAt['lte'] = filters.dateTo;
    where['createdAt'] = createdAt;
  }

  const [data, total] = await Promise.all([
    prisma.debugEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.debugEvent.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ---------------------------------------------------------------------------
// Get with correlations
// ---------------------------------------------------------------------------

/**
 * Fetch a single debug event plus correlated events by:
 * - requestId (same request, different source = client↔server link)
 * - sessionId (same test session, ±10 minutes)
 * - fingerprint (all occurrences of the same error pattern)
 */
export async function getDebugEventWithCorrelations(
  id: string,
): Promise<DebugEventWithCorrelations | null> {
  const event = await prisma.debugEvent.findUnique({ where: { id } });
  if (!event) return null;

  const minus10min = new Date(event.createdAt.getTime() - 10 * 60 * 1000);
  const plus10min = new Date(event.createdAt.getTime() + 10 * 60 * 1000);

  const [correlatedByRequest, correlatedBySession, fingerprintGroup] = await Promise.all([
    event.requestId
      ? prisma.debugEvent.findMany({
          where: { requestId: event.requestId, id: { not: id } },
          orderBy: { createdAt: 'asc' },
        })
      : [],

    event.sessionId
      ? prisma.debugEvent.findMany({
          where: {
            sessionId: event.sessionId,
            id: { not: id },
            createdAt: { gte: minus10min, lte: plus10min },
          },
          orderBy: { createdAt: 'asc' },
        })
      : [],

    event.fingerprint
      ? prisma.debugEvent.findMany({
          where: { fingerprint: event.fingerprint, id: { not: id } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        })
      : [],
  ]);

  return { event, correlatedByRequest, correlatedBySession, fingerprintGroup };
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export interface DebugEventUpdates {
  status?: DebugEventStatus;
  testerNote?: string | null;
  groupId?: string | null;
  duplicateOf?: string | null;
}

export async function updateDebugEvent(id: string, updates: DebugEventUpdates): Promise<DebugEvent> {
  return prisma.debugEvent.update({
    where: { id },
    data: updates,
  });
}

// ---------------------------------------------------------------------------
// Module inference
// ---------------------------------------------------------------------------

/**
 * Derive the module slug from a URL path.
 * /api/v1/packages/123/release → 'packages'
 * /packages → 'packages'
 * /auth/login → 'auth'
 */
export function inferModuleFromPath(path: string): string {
  const clean = path
    .replace(/^\/api\/v1\//, '')
    .replace(/^\/api\//, '')
    .replace(/^\//, '');
  return clean.split('/')[0] ?? 'unknown';
}

// ---------------------------------------------------------------------------
// Module → file mapping (for AI packet — Phase 4)
// ---------------------------------------------------------------------------

interface ModuleFiles {
  frontend: string[];
  backend: string[];
  apiRoutes: string[];
  prismaModels: string[];
}

const MODULE_FILE_MAP: Record<string, ModuleFiles> = {
  packages: {
    frontend: ['src/app/(portal)/packages/page.tsx', 'src/app/(portal)/packages/[id]/page.tsx'],
    backend: ['src/app/api/v1/packages/route.ts', 'src/app/api/v1/packages/[id]/route.ts'],
    apiRoutes: ['GET /api/v1/packages', 'POST /api/v1/packages', 'PATCH /api/v1/packages/[id]'],
    prismaModels: ['Package', 'Event', 'Unit', 'CourierType'],
  },
  maintenance: {
    frontend: ['src/app/(portal)/maintenance/page.tsx', 'src/app/(portal)/maintenance/[id]/page.tsx'],
    backend: ['src/app/api/v1/maintenance/route.ts', 'src/app/api/v1/maintenance/[id]/route.ts'],
    apiRoutes: ['GET /api/v1/maintenance', 'POST /api/v1/maintenance'],
    prismaModels: ['MaintenanceRequest', 'MaintenanceCategory', 'MaintenanceComment'],
  },
  auth: {
    frontend: ['src/app/(auth)/login/page.tsx', 'src/lib/hooks/use-auth.ts'],
    backend: ['src/app/api/auth/login/route.ts', 'src/server/middleware/auth.ts', 'src/server/middleware/chain.ts'],
    apiRoutes: ['POST /api/auth/login', 'POST /api/auth/refresh', 'POST /api/auth/logout'],
    prismaModels: ['User', 'Session', 'LoginAudit', 'RefreshToken'],
  },
  security: {
    frontend: ['src/app/(portal)/security/page.tsx'],
    backend: ['src/app/api/v1/security/route.ts', 'src/app/api/v1/incidents/route.ts'],
    apiRoutes: ['GET /api/v1/security', 'POST /api/v1/incidents'],
    prismaModels: ['Event', 'EventType', 'IncidentReport'],
  },
  amenities: {
    frontend: ['src/app/(portal)/amenities/page.tsx', 'src/app/(portal)/amenity-booking/page.tsx'],
    backend: ['src/app/api/v1/amenities/route.ts', 'src/app/api/v1/bookings/route.ts'],
    apiRoutes: ['GET /api/v1/amenities', 'POST /api/v1/bookings', 'PATCH /api/v1/bookings/[id]'],
    prismaModels: ['Amenity', 'Booking', 'BookingAuditEntry'],
  },
  users: {
    frontend: ['src/app/(portal)/users/page.tsx', 'src/app/(admin)/users/page.tsx'],
    backend: ['src/app/api/v1/users/route.ts', 'src/app/api/v1/users/[id]/route.ts'],
    apiRoutes: ['GET /api/v1/users', 'POST /api/v1/users', 'PATCH /api/v1/users/[id]'],
    prismaModels: ['User', 'UserProperty', 'Role'],
  },
  units: {
    frontend: ['src/app/(portal)/units/page.tsx', 'src/app/(portal)/units/[id]/page.tsx'],
    backend: ['src/app/api/v1/units/route.ts', 'src/app/api/v1/units/[id]/route.ts'],
    apiRoutes: ['GET /api/v1/units', 'POST /api/v1/units', 'PATCH /api/v1/units/[id]'],
    prismaModels: ['Unit', 'Building', 'Property'],
  },
  residents: {
    frontend: ['src/app/(portal)/residents/page.tsx', 'src/app/(portal)/residents/[id]/page.tsx'],
    backend: ['src/app/api/v1/residents/route.ts'],
    apiRoutes: ['GET /api/v1/residents', 'POST /api/v1/residents'],
    prismaModels: ['User', 'OccupancyRecord', 'UserProperty'],
  },
  announcements: {
    frontend: ['src/app/(portal)/announcements/page.tsx'],
    backend: ['src/app/api/v1/announcements/route.ts', 'src/app/api/v1/announcements/[id]/route.ts'],
    apiRoutes: ['GET /api/v1/announcements', 'POST /api/v1/announcements'],
    prismaModels: ['Announcement', 'AnnouncementDelivery', 'AnnouncementTemplate'],
  },
  visitors: {
    frontend: ['src/app/(portal)/visitors/page.tsx'],
    backend: ['src/app/api/v1/visitors/route.ts', 'src/app/api/v1/visitors/[id]/route.ts'],
    apiRoutes: ['GET /api/v1/visitors', 'POST /api/v1/visitors'],
    prismaModels: ['VisitorEntry'],
  },
  parking: {
    frontend: ['src/app/(portal)/parking/page.tsx'],
    backend: ['src/app/api/v1/parking/route.ts', 'src/app/api/v1/parking/violations/route.ts'],
    apiRoutes: ['GET /api/v1/parking', 'POST /api/v1/parking/violations'],
    prismaModels: ['ParkingPermit', 'ParkingViolation', 'ParkingSpot', 'ParkingArea'],
  },
  training: {
    frontend: ['src/app/(portal)/training/page.tsx', 'src/app/(portal)/training/[id]/page.tsx'],
    backend: ['src/app/api/v1/training/route.ts', 'src/app/api/v1/training/[id]/route.ts'],
    apiRoutes: ['GET /api/v1/training', 'POST /api/v1/training/[id]/enroll'],
    prismaModels: ['Course', 'CourseModule', 'Enrollment', 'TrainingProgress', 'Quiz'],
  },
  vendors: {
    frontend: ['src/app/(portal)/vendors/page.tsx', 'src/app/(portal)/vendors/[id]/page.tsx'],
    backend: ['src/app/api/v1/vendors/route.ts', 'src/app/api/v1/vendors/[id]/route.ts'],
    apiRoutes: ['GET /api/v1/vendors', 'POST /api/v1/vendors'],
    prismaModels: ['Vendor', 'VendorDocument', 'Certificate'],
  },
  equipment: {
    frontend: ['src/app/(portal)/equipment/page.tsx'],
    backend: ['src/app/api/v1/equipment/route.ts', 'src/app/api/v1/equipment/[id]/route.ts'],
    apiRoutes: ['GET /api/v1/equipment', 'POST /api/v1/equipment'],
    prismaModels: ['Asset', 'AssetAudit'],
  },
  billing: {
    frontend: ['src/app/(portal)/settings/billing/page.tsx', 'src/app/(portal)/system/billing/page.tsx'],
    backend: ['src/app/api/v1/billing/route.ts', 'src/app/api/v1/billing/checkout/route.ts'],
    apiRoutes: ['GET /api/v1/billing', 'POST /api/v1/billing/checkout'],
    prismaModels: ['Subscription', 'Invoice'],
  },
  dashboard: {
    frontend: ['src/app/(portal)/dashboard/page.tsx'],
    backend: ['src/app/api/v1/dashboard/route.ts'],
    apiRoutes: ['GET /api/v1/dashboard'],
    prismaModels: ['Property', 'DashboardWidget', 'DashboardLayout'],
  },
  reports: {
    frontend: ['src/app/(portal)/reports/page.tsx'],
    backend: ['src/app/api/v1/reports/route.ts', 'src/app/api/v1/export/route.ts'],
    apiRoutes: ['GET /api/v1/reports', 'POST /api/v1/export'],
    prismaModels: ['Report', 'ReportRun', 'ReportSchedule'],
  },
  settings: {
    frontend: ['src/app/(portal)/settings/page.tsx', 'src/app/(admin)/settings/'],
    backend: ['src/app/api/v1/settings/route.ts'],
    apiRoutes: ['GET /api/v1/settings', 'PATCH /api/v1/settings'],
    prismaModels: ['PropertySettings', 'NotificationPreferences'],
  },
  'shift-log': {
    frontend: ['src/app/(portal)/shift-log/page.tsx'],
    backend: ['src/app/api/v1/shift-log/route.ts'],
    apiRoutes: ['GET /api/v1/shift-log', 'POST /api/v1/shift-log'],
    prismaModels: ['ShiftLogEntry', 'ShiftHandoff'],
  },
  keys: {
    frontend: ['src/app/(portal)/keys/page.tsx'],
    backend: ['src/app/api/v1/keys/route.ts', 'src/app/api/v1/keys/checkouts/route.ts'],
    apiRoutes: ['GET /api/v1/keys', 'POST /api/v1/keys/checkouts'],
    prismaModels: ['KeyInventory', 'KeyCheckout'],
  },
  inspections: {
    frontend: ['src/app/(portal)/inspections/page.tsx'],
    backend: ['src/app/api/v1/inspections/route.ts'],
    apiRoutes: ['GET /api/v1/inspections', 'POST /api/v1/inspections'],
    prismaModels: ['Inspection', 'InspectionItem', 'InspectionTemplate'],
  },
  community: {
    frontend: ['src/app/(portal)/community/page.tsx', 'src/app/(portal)/marketplace/page.tsx'],
    backend: ['src/app/api/v1/community/route.ts', 'src/app/api/v1/classifieds/route.ts'],
    apiRoutes: ['GET /api/v1/community', 'GET /api/v1/classifieds'],
    prismaModels: ['CommunityEvent', 'ClassifiedAd'],
  },
  events: {
    frontend: ['src/app/(portal)/events/page.tsx'],
    backend: ['src/app/api/v1/events/route.ts', 'src/app/api/v1/event-types/route.ts'],
    apiRoutes: ['GET /api/v1/events', 'POST /api/v1/events'],
    prismaModels: ['Event', 'EventType', 'EventGroup'],
  },
  'data-migration': {
    frontend: ['src/app/(portal)/data-migration/page.tsx'],
    backend: ['src/app/api/v1/data-migration/import/route.ts', 'src/app/api/v1/data-migration/export/route.ts'],
    apiRoutes: ['POST /api/v1/data-migration/import', 'POST /api/v1/data-migration/export'],
    prismaModels: ['ImportJob', 'DataExportRequest'],
  },
  developer: {
    frontend: ['src/app/(portal)/developer-portal/page.tsx'],
    backend: ['src/app/api/v1/developer/api-keys/route.ts', 'src/app/api/v1/developer/webhooks/route.ts'],
    apiRoutes: ['GET /api/v1/developer/api-keys', 'POST /api/v1/developer/api-keys'],
    prismaModels: ['ApiKey', 'Webhook', 'WebhookDelivery'],
  },
  compliance: {
    frontend: ['src/app/(portal)/compliance/page.tsx'],
    backend: ['src/app/api/v1/compliance/route.ts', 'src/app/api/v1/compliance/reports/route.ts'],
    apiRoutes: ['GET /api/v1/compliance', 'POST /api/v1/compliance/reports'],
    prismaModels: ['ComplianceReport'],
  },
  help: {
    frontend: ['src/app/(portal)/help-center/page.tsx'],
    backend: ['src/app/api/v1/help/articles/route.ts', 'src/app/api/v1/help/tickets/route.ts'],
    apiRoutes: ['GET /api/v1/help/articles', 'POST /api/v1/help/tickets'],
    prismaModels: ['HelpArticle', 'SupportTicket'],
  },
  demo: {
    frontend: ['src/app/(portal)/system/demo/page.tsx'],
    backend: ['src/app/api/v1/demo/route.ts', 'src/app/api/v1/demo/[id]/reset/route.ts'],
    apiRoutes: ['GET /api/v1/demo', 'POST /api/v1/demo/[id]/reset'],
    prismaModels: ['DemoSession', 'DemoTemplate'],
  },
};

const DEFAULT_FILES: ModuleFiles = {
  frontend: ['src/components/', 'src/lib/'],
  backend: ['src/server/', 'src/app/api/'],
  apiRoutes: [],
  prismaModels: [],
};

export function getModuleFiles(module: string | null): ModuleFiles {
  if (!module) return DEFAULT_FILES;
  return MODULE_FILE_MAP[module] ?? DEFAULT_FILES;
}

// ---------------------------------------------------------------------------
// AI Packet (Phase 4) — structured context bundle for AI-assisted diagnosis
// ---------------------------------------------------------------------------

export interface AiPacket {
  event: {
    id: string;
    type: string;
    severity: string;
    source: string;
    route: string | null;
    module: string | null;
    title: string;
    errorCode: string | null;
    errorMessage: string | null;
    stackTrace: string | null;
    context: unknown;
    actionTrail: unknown;
    testerNote: string | null;
    isManualFlag: boolean;
    createdAt: string;
    environment: string;
  };
  correlations: {
    requestPartners: Array<{
      id: string;
      type: string;
      severity: string;
      source: string;
      title: string;
      errorCode: string | null;
      errorMessage: string | null;
    }>;
    sessionEvents: Array<{
      id: string;
      type: string;
      severity: string;
      title: string;
      route: string | null;
      createdAt: string;
    }>;
    recurrenceCount: number;
  };
  moduleFiles: ModuleFiles;
  claudePrompt: string;
}

/**
 * Build a structured AI context packet for a single debug event.
 *
 * Returns null if the event doesn't exist.
 * The claudePrompt is a deterministic markdown blob ready to paste into any AI.
 */
export async function buildAiPacket(id: string): Promise<AiPacket | null> {
  const result = await getDebugEventWithCorrelations(id);
  if (!result) return null;

  const { event, correlatedByRequest, correlatedBySession, fingerprintGroup } = result;
  const moduleFiles = getModuleFiles(event.module);

  // ---------------------------------------------------------------------------
  // Build claudePrompt — deterministic, no LLM needed
  // ---------------------------------------------------------------------------

  const lines: string[] = [];

  lines.push(`# Bug Report — ${event.type} (${event.severity})`);
  lines.push('');
  lines.push('## What Happened');
  lines.push(`**Title:** ${event.title}`);
  if (event.errorCode) lines.push(`**Error Code:** \`${event.errorCode}\``);
  if (event.errorMessage) lines.push(`**Error Message:** ${event.errorMessage}`);
  if (event.route) lines.push(`**Route:** \`${event.route}\``);
  if (event.module) lines.push(`**Module:** ${event.module}`);
  lines.push(
    `**Source:** ${event.source} | **Severity:** ${event.severity} | **Environment:** ${event.environment}`,
  );

  if (event.testerNote) {
    lines.push('');
    lines.push('## Tester Note');
    lines.push(event.testerNote);
  }

  if (event.stackTrace) {
    lines.push('');
    lines.push('## Stack Trace');
    lines.push('```');
    lines.push(event.stackTrace.slice(0, 3000));
    lines.push('```');
  }

  const trail = event.actionTrail as Array<{
    type: string;
    route: string;
    element?: string;
    timestamp: string;
  }> | null;

  if (Array.isArray(trail) && trail.length > 0) {
    lines.push('');
    lines.push('## Action Trail (what the user did before this happened)');
    trail.forEach((action, i) => {
      const el = action.element ? ` → \`${action.element}\`` : '';
      lines.push(`${i + 1}. **${action.type}** on \`${action.route}\`${el}`);
    });
  }

  if (event.context) {
    lines.push('');
    lines.push('## Context');
    lines.push('```json');
    lines.push(JSON.stringify(event.context, null, 2).slice(0, 2000));
    lines.push('```');
  }

  if (correlatedByRequest.length > 0) {
    lines.push('');
    lines.push('## Server-Side Partner (same requestId — client↔server link)');
    correlatedByRequest.forEach((e) => {
      lines.push(`- **${e.type}** (${e.severity}) from ${e.source}: ${e.title}`);
      if (e.errorCode) lines.push(`  - Error Code: \`${e.errorCode}\``);
      if (e.errorMessage) lines.push(`  - Error Message: ${e.errorMessage}`);
    });
  }

  if (fingerprintGroup.length > 0) {
    lines.push('');
    lines.push(`## Recurring Issue — ${fingerprintGroup.length + 1} total occurrences`);
    lines.push('This exact error pattern has occurred before. It is NOT a one-off.');
    const oldest = fingerprintGroup[fingerprintGroup.length - 1];
    if (oldest) {
      lines.push(`First seen: ${oldest.createdAt.toISOString()}`);
    }
  }

  lines.push('');
  lines.push('## Files to Examine');
  if (moduleFiles.frontend.length > 0) {
    lines.push('**Frontend:**');
    moduleFiles.frontend.forEach((f) => lines.push(`- \`${f}\``));
  }
  if (moduleFiles.backend.length > 0) {
    lines.push('**Backend:**');
    moduleFiles.backend.forEach((f) => lines.push(`- \`${f}\``));
  }
  if (moduleFiles.apiRoutes.length > 0) {
    lines.push('**API Routes:**');
    moduleFiles.apiRoutes.forEach((r) => lines.push(`- ${r}`));
  }
  if (moduleFiles.prismaModels.length > 0) {
    lines.push('**Prisma Models:**');
    moduleFiles.prismaModels.forEach((m) => lines.push(`- ${m}`));
  }

  lines.push('');
  lines.push('## Instructions for the AI');
  lines.push('1. Read the files listed above.');
  lines.push('2. Identify the **root cause** of the error, not just the symptom.');
  lines.push('3. Explain what is failing and why in plain language.');
  lines.push('4. Propose the minimal fix with code changes shown as diffs or edited snippets.');
  if (fingerprintGroup.length > 0) {
    lines.push('5. This is a recurring issue — explain why previous fixes may have missed it.');
  }

  return {
    event: {
      id: event.id,
      type: event.type,
      severity: event.severity,
      source: event.source,
      route: event.route,
      module: event.module,
      title: event.title,
      errorCode: event.errorCode,
      errorMessage: event.errorMessage,
      stackTrace: event.stackTrace,
      context: event.context,
      actionTrail: event.actionTrail,
      testerNote: event.testerNote,
      isManualFlag: event.isManualFlag,
      createdAt: event.createdAt.toISOString(),
      environment: event.environment,
    },
    correlations: {
      requestPartners: correlatedByRequest.map((e) => ({
        id: e.id,
        type: e.type,
        severity: e.severity,
        source: e.source,
        title: e.title,
        errorCode: e.errorCode,
        errorMessage: e.errorMessage,
      })),
      sessionEvents: correlatedBySession.map((e) => ({
        id: e.id,
        type: e.type,
        severity: e.severity,
        title: e.title,
        route: e.route,
        createdAt: e.createdAt.toISOString(),
      })),
      recurrenceCount: fingerprintGroup.length + 1,
    },
    moduleFiles,
    claudePrompt: lines.join('\n'),
  };
}
