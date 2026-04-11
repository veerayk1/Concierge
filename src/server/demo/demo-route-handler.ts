/**
 * Demo route handler — intercepts API requests in demo mode
 * and returns data from the in-memory store.
 *
 * When `x-demo-role` header is present, this handler short-circuits
 * the real database query and returns realistic mock data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDemoStore } from './demo-data-store';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns a NextResponse with demo data if the request is in demo mode,
 * or `null` if the request should proceed to the real handler.
 */
export async function handleDemoRequest(request: NextRequest): Promise<NextResponse | null> {
  const demoRole = request.headers.get('x-demo-role');
  if (!demoRole) return null;

  const demoMode = request.headers.get('x-demo-mode');

  // Only serve demo/fake data when explicitly in "showcase" mode
  // (i.e. from the Demo Account sandbox section for sales demos).
  // Regular demo role buttons should use REAL database data.
  if (demoMode !== 'showcase') return null;

  const isSuperAdminClean = demoRole === 'super_admin' && demoMode !== 'showcase';

  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  const path = url.pathname;

  // Super Admin clean mode: use the REAL database for everything.
  // This ensures properties, users, and roles are actually persisted and returned correctly.
  // Only serve demo data for health endpoints and dashboard (which need aggregated stats).
  if (isSuperAdminClean) {
    // Health endpoints — handled by normal matchRoute
    if (path === '/api/health' || path === '/api/health/detailed') {
      // Fall through to matchRoute below
    }
    // Dashboard — return real stats from DB
    else if (path === '/api/v1/dashboard') {
      return null; // Let real API handler return live data
    }
    // Everything else in clean mode goes to real DB
    else {
      return null;
    }
  }

  try {
    // Route matching
    const handler = await matchRoute(method, path, url.searchParams, request);
    if (handler) return handler;

    // Safety net — never let a demo request reach the database
    if (method === 'GET') {
      return json({ data: [] });
    }
    return json({ data: { id: randomUUID() }, message: 'Success' }, 200);
  } catch (err) {
    console.error('[demo-handler] Error:', err);
    return json({ data: [] });
  }
}

/**
 * When Super Admin is NOT in showcase mode, return empty/zeroed data.
 * This makes the Super Admin panel look like a fresh, clean platform.
 */
// Pre-seeded demo property IDs — these should be hidden in clean Super Admin mode
const SEEDED_PROPERTY_IDS = new Set([
  '00000000-0000-4000-b000-000000000001', // Maple Heights
  '00000000-0000-4000-b000-000000000002', // Lakeshore Towers
  '00000000-0000-4000-b000-000000000003', // Harbourfront Residences
]);

function handleSuperAdminClean(
  method: string,
  path: string,
  params: URLSearchParams,
): NextResponse | null {
  // Health endpoints — fall through to normal demo handling
  if (path === '/api/health' || path === '/api/health/detailed') {
    return null;
  }

  // POST /api/v1/properties — Super Admin can still create properties
  if (path === '/api/v1/properties' && method === 'POST') {
    return null;
  }

  // GET /api/v1/properties — show user-created properties, hide seeded ones
  if (path === '/api/v1/properties' && method === 'GET') {
    const store = getDemoStore();
    const all = store.getAll('properties');
    const userCreated = all.data.filter(
      (p: Record<string, unknown>) => !SEEDED_PROPERTY_IDS.has(p.id as string),
    );
    return json({ data: userCreated });
  }

  // GET /api/v1/properties/:id — allow if user-created, 404 if seeded
  const propMatch = path.match(/^\/api\/v1\/properties\/([^/]+)$/);
  if (propMatch && method === 'GET') {
    const id = propMatch[1]!;
    if (SEEDED_PROPERTY_IDS.has(id)) {
      return json({ error: 'NOT_FOUND', message: 'Property not found' }, 404);
    }
    return null; // Fall through to normal matchRoute
  }

  // ALL non-GET mutations fall through to matchRoute so data is actually persisted.
  // matchRoute handles POST/PATCH/PUT for users, packages, maintenance, etc.
  if (method !== 'GET') {
    return null;
  }

  if (path === '/api/v1/dashboard') {
    const store = getDemoStore();
    const all = store.getAll('properties');
    const userCreated = all.data.filter(
      (p: Record<string, unknown>) => !SEEDED_PROPERTY_IDS.has(p.id as string),
    );
    const totalUnits = userCreated.reduce(
      (sum: number, p: Record<string, unknown>) => sum + ((p.unitCount as number) || 0),
      0,
    );
    const users = store.getAll('users');
    const userCreatedUsers = users.data.filter(
      (u: Record<string, unknown>) => !SEEDED_PROPERTY_IDS.has(u.propertyId as string),
    );
    return json({
      data: {
        kpis: {
          unreleasedPackages: 0,
          activeVisitors: 0,
          openMaintenanceRequests: 0,
          todayEvents: 0,
          pendingBookingApprovals: 0,
          unreadAnnouncements: 0,
          overdueMaintenanceRequests: 0,
          monthlyPackageVolume: 0,
          avgResolutionTimeHours: 0,
          totalProperties: userCreated.length,
          totalUnits: totalUnits,
          activeUsers: userCreatedUsers.length,
        },
        recentActivity: [],
      },
    });
  }

  // GET /api/v1/users — show users for user-created properties only
  if (path === '/api/v1/users') {
    const store = getDemoStore();
    const requestedPropertyId = params.get('propertyId');
    const allUsers = store.getAll('users');
    let filteredUsers = allUsers.data.filter(
      (u: Record<string, unknown>) => !SEEDED_PROPERTY_IDS.has(u.propertyId as string),
    );
    // If a specific propertyId is requested, further filter
    if (requestedPropertyId) {
      filteredUsers = filteredUsers.filter(
        (u: Record<string, unknown>) => u.propertyId === requestedPropertyId,
      );
    }
    return json({
      data: filteredUsers,
      meta: { page: 1, pageSize: 50, total: filteredUsers.length, totalPages: 1 },
    });
  }

  if (path === '/api/v1/billing') {
    return json({ data: { tier: null, status: 'none' } });
  }

  if (path === '/api/v1/search') {
    return json({ data: { results: [], total: 0 } });
  }

  if (path === '/api/v1/notifications') {
    return json({ data: [], meta: { unreadCount: 0 } });
  }

  if (path === '/api/v1/audit-log') {
    return json({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });
  }

  // GET /api/v1/roles — for real (non-seeded) properties, fall through to DB
  // For seeded or unknown properties, return hardcoded system roles
  if (path === '/api/v1/roles') {
    const requestedPropertyId = params.get('propertyId');
    // If requesting roles for a user-created (non-seeded) property, fall through to real DB
    if (requestedPropertyId && !SEEDED_PROPERTY_IDS.has(requestedPropertyId)) {
      return null; // Let the real API handler query the database
    }
    const SYSTEM_ROLES = [
      {
        id: '00000000-0000-4000-c000-000000000001',
        name: 'Property Admin',
        slug: 'property_admin',
        isSystem: true,
        memberCount: 0,
      },
      {
        id: '00000000-0000-4000-c000-000000000002',
        name: 'Property Manager',
        slug: 'property_manager',
        isSystem: true,
        memberCount: 0,
      },
      {
        id: '00000000-0000-4000-c000-000000000003',
        name: 'Security Supervisor',
        slug: 'security_supervisor',
        isSystem: true,
        memberCount: 0,
      },
      {
        id: '00000000-0000-4000-c000-000000000004',
        name: 'Security Guard',
        slug: 'security_guard',
        isSystem: true,
        memberCount: 0,
      },
      {
        id: '00000000-0000-4000-c000-000000000005',
        name: 'Front Desk / Concierge',
        slug: 'front_desk',
        isSystem: true,
        memberCount: 0,
      },
      {
        id: '00000000-0000-4000-c000-000000000006',
        name: 'Maintenance Staff',
        slug: 'maintenance_staff',
        isSystem: true,
        memberCount: 0,
      },
      {
        id: '00000000-0000-4000-c000-000000000007',
        name: 'Superintendent',
        slug: 'superintendent',
        isSystem: true,
        memberCount: 0,
      },
      {
        id: '00000000-0000-4000-c000-000000000008',
        name: 'Board Member',
        slug: 'board_member',
        isSystem: true,
        memberCount: 0,
      },
      {
        id: '00000000-0000-4000-c000-000000000009',
        name: 'Resident (Owner)',
        slug: 'resident_owner',
        isSystem: true,
        memberCount: 0,
      },
      {
        id: '00000000-0000-4000-c000-000000000010',
        name: 'Resident (Tenant)',
        slug: 'resident_tenant',
        isSystem: true,
        memberCount: 0,
      },
      {
        id: '00000000-0000-4000-c000-000000000011',
        name: 'Family Member',
        slug: 'family_member',
        isSystem: true,
        memberCount: 0,
      },
    ];
    return json({ data: SYSTEM_ROLES });
  }

  // Generic empty response for any other GET on seeded-property-scoped data
  return json({ data: [] });
}

// ---------------------------------------------------------------------------
// Route matching
// ---------------------------------------------------------------------------

async function matchRoute(
  method: string,
  path: string,
  params: URLSearchParams,
  request: NextRequest,
): Promise<NextResponse | null> {
  const store = getDemoStore();
  const search = params.get('search') || undefined;
  const page = parseInt(params.get('page') || '1');
  const pageSize = parseInt(params.get('pageSize') || '50');
  const propertyId = params.get('propertyId') || '00000000-0000-4000-b000-000000000001';

  // --- Debug events — always pass through to real DB so events are captured ----
  if (path === '/api/v1/debug/events') {
    return null;
  }

  // --- Health endpoints (no auth) ------------------------------------------
  if (path === '/api/health') {
    return json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      responseTime: '1.23ms',
    });
  }

  if (path === '/api/health/detailed') {
    return json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      responseTime: '2.15ms',
      services: {
        database: { status: 'ok', responseTime: '1.05ms' },
        redis: { status: 'ok', responseTime: '0.42ms' },
      },
    });
  }

  // --- Properties -----------------------------------------------------------
  if (path === '/api/v1/properties' && method === 'GET') {
    const typeFilter = params.get('type') || undefined;
    const result = store.getAll('properties', {
      where: typeFilter ? { type: typeFilter } : undefined,
      search: search ? { fields: ['name', 'address', 'city'], query: search } : undefined,
    });
    return json({ data: result.data });
  }

  if (path === '/api/v1/properties' && method === 'POST') {
    // Simulate property creation
    return jsonAsync(request, async (body: Record<string, unknown>) => {
      const property = store.create('properties', {
        ...body,
        type: body.type || 'PRODUCTION',
        subscriptionTier: 'TIER_1',
        propertyCode: `P${randomUUID().slice(0, 7).toUpperCase()}`,
        isActive: true,
        slug:
          String(body.name || 'new-property')
            .toLowerCase()
            .replace(/\s+/g, '-') +
          '-' +
          Date.now().toString(36),
        branding: {},
      });
      return json({ data: property }, 201);
    });
  }

  // Match /api/v1/properties/:id
  const propMatch = path.match(/^\/api\/v1\/properties\/([^/]+)$/);
  if (propMatch && method === 'GET') {
    const prop = store.getById('properties', propMatch[1]!);
    if (!prop) return json({ error: 'NOT_FOUND', message: 'Property not found' }, 404);
    return json({ data: prop });
  }

  if (propMatch && (method === 'PATCH' || method === 'PUT')) {
    return jsonAsync(request, async (body: Record<string, unknown>) => {
      const updated = store.update('properties', propMatch[1]!, body);
      if (!updated) return json({ error: 'NOT_FOUND', message: 'Property not found' }, 404);
      return json({ data: updated });
    });
  }

  // --- Properties Dashboard ---------------------------------------------------
  if (path === '/api/v1/properties/dashboard' && method === 'GET') {
    const props = store.getAll('properties');
    const totalUnits = props.data.reduce(
      (sum: number, p: Record<string, unknown>) => sum + ((p.unitCount as number) || 0),
      0,
    );
    return json({
      data: {
        totalProperties: props.data.length,
        totalUnits,
        openEvents: 12,
        openMaintenanceRequests: 8,
        pendingPackages: 15,
        upcomingBookings: 6,
        properties: props.data.map((p: Record<string, unknown>) => ({
          id: p.id,
          name: p.name,
          unitCount: p.unitCount,
          type: p.type,
          isActive: p.isActive,
          subscriptionTier: p.subscriptionTier,
        })),
      },
    });
  }

  // --- Dashboard ------------------------------------------------------------
  if (path === '/api/v1/dashboard' && method === 'GET') {
    const dash = store.getAll('dashboard', { where: { propertyId } });
    if (dash.data.length > 0) {
      return json({ data: dash.data[0] });
    }
    // Fallback
    return json({
      data: {
        kpis: {
          unreleasedPackages: 0,
          activeVisitors: 0,
          openMaintenanceRequests: 0,
          todayEvents: 0,
          pendingBookingApprovals: 0,
          unreadAnnouncements: 0,
          overdueMaintenanceRequests: 0,
          monthlyPackageVolume: 0,
          avgResolutionTimeHours: 0,
        },
        recentActivity: [],
      },
    });
  }

  // --- AI Analytics ----------------------------------------------------------
  if ((path === '/api/v1/ai/analytics' || path === '/api/v1/ai/briefing') && method === 'GET') {
    const ai = store.getAll('aiAnalytics', { where: { propertyId } });
    return json({
      data: ai.data[0] || {
        healthScore: 0,
        trend: 'flat',
        factors: [],
        packageDeliveryTrend: [],
        maintenanceSlaCompliance: 0,
      },
    });
  }

  if (path === '/api/v1/ai/suggestions' && method === 'GET') {
    return json({
      data: [
        {
          id: '1',
          type: 'maintenance',
          title: 'Schedule HVAC inspection',
          description:
            'Based on seasonal patterns, schedule preventive HVAC maintenance before summer.',
          priority: 'medium',
          confidence: 0.87,
        },
        {
          id: '2',
          type: 'package',
          title: 'Peak delivery hours alert',
          description:
            'Package volume is 30% higher between 2-4 PM. Consider additional front desk coverage.',
          priority: 'low',
          confidence: 0.92,
        },
        {
          id: '3',
          type: 'security',
          title: 'Update patrol schedule',
          description:
            'Recent incidents suggest increasing patrol frequency in P1 parking during evening hours.',
          priority: 'high',
          confidence: 0.78,
        },
      ],
    });
  }

  // --- Billing ---------------------------------------------------------------
  if (path === '/api/v1/billing' && method === 'GET') {
    const bill = store.getAll('billing', { where: { propertyId } });
    return json({ data: bill.data[0] || { tier: null, status: 'none' } });
  }

  if (path.startsWith('/api/v1/billing/invoices')) {
    return json({ data: [] });
  }

  // --- Users -----------------------------------------------------------------
  if (path === '/api/v1/users' && method === 'GET') {
    const roleFilter = params.get('role') || undefined;
    const statusFilter = params.get('status') || undefined;
    const result = store.getAll('users', {
      where: { propertyId, ...(statusFilter ? { status: statusFilter } : {}) },
      search: search ? { fields: ['firstName', 'lastName', 'email'], query: search } : undefined,
      page,
      pageSize,
    });
    // Filter by role slug if provided
    let filtered = result.data;
    if (roleFilter) {
      filtered = filtered.filter((u: Record<string, unknown>) => {
        const role = u.role as { slug?: string } | undefined;
        return role?.slug === roleFilter;
      });
    }
    return json({
      data: filtered,
      meta: result.meta || { page, pageSize, total: filtered.length, totalPages: 1 },
    });
  }

  if (path === '/api/v1/users' && method === 'POST') {
    return jsonAsync(request, async (body: Record<string, unknown>) => {
      const userPropertyId = (body.propertyId as string) || propertyId;
      const user = store.create('users', {
        ...body,
        propertyId: userPropertyId,
        status: 'pending',
        isActive: false,
        mfaEnabled: false,
        lastLoginAt: null,
      });
      return json({ data: user }, 201);
    });
  }

  // --- Roles ------------------------------------------------------------------
  if (path === '/api/v1/roles' && method === 'GET') {
    return json({
      data: [
        {
          id: 'role-pa',
          name: 'Property Admin',
          slug: 'property_admin',
          description: 'Full property management access',
        },
        {
          id: 'role-pm',
          name: 'Property Manager',
          slug: 'property_manager',
          description: 'Day-to-day operations',
        },
        {
          id: 'role-fd',
          name: 'Front Desk / Concierge',
          slug: 'front_desk',
          description: 'Concierge and reception',
        },
        {
          id: 'role-sg',
          name: 'Security Guard',
          slug: 'security_guard',
          description: 'Security console access',
        },
        {
          id: 'role-ss',
          name: 'Security Supervisor',
          slug: 'security_supervisor',
          description: 'Security team management',
        },
        {
          id: 'role-ms',
          name: 'Maintenance Staff',
          slug: 'maintenance_staff',
          description: 'Work orders and repairs',
        },
        {
          id: 'role-su',
          name: 'Superintendent',
          slug: 'superintendent',
          description: 'Building operations',
        },
        {
          id: 'role-bm',
          name: 'Board Member',
          slug: 'board_member',
          description: 'Governance and reports',
        },
        {
          id: 'role-ro',
          name: 'Resident (Owner)',
          slug: 'resident_owner',
          description: 'Unit owner',
        },
        {
          id: 'role-rt',
          name: 'Resident (Tenant)',
          slug: 'resident_tenant',
          description: 'Unit tenant',
        },
        {
          id: 'role-fm',
          name: 'Family Member',
          slug: 'family_member',
          description: 'Family member of resident',
        },
        {
          id: 'role-oo',
          name: 'Offsite Owner',
          slug: 'offsite_owner',
          description: 'Non-resident unit owner',
        },
      ],
    });
  }

  // --- Packages ---------------------------------------------------------------
  if (path === '/api/v1/packages' && method === 'GET') {
    const statusFilter = params.get('status') || undefined;
    const result = store.getAll('packages', {
      where: { propertyId, ...(statusFilter ? { status: statusFilter } : {}) },
      search: search ? { fields: ['referenceNumber', 'trackingNumber'], query: search } : undefined,
      page,
      pageSize,
    });
    return json({ data: result.data, meta: result.meta });
  }

  if (path === '/api/v1/packages' && method === 'POST') {
    return jsonAsync(request, async (body: Record<string, unknown>) => {
      const pkg = store.create('packages', {
        ...body,
        propertyId,
        referenceNumber: `PKG-${randomUUID().slice(0, 6).toUpperCase()}`,
        status: 'unreleased',
        direction: 'inbound',
      });
      return json({ data: pkg }, 201);
    });
  }

  // --- Maintenance ------------------------------------------------------------
  if (path === '/api/v1/maintenance' && method === 'GET') {
    const statusFilter = params.get('status') || undefined;
    const priorityFilter = params.get('priority') || undefined;
    const result = store.getAll('maintenance', {
      where: {
        propertyId,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(priorityFilter ? { priority: priorityFilter } : {}),
      },
      search: search
        ? { fields: ['title', 'description', 'referenceNumber'], query: search }
        : undefined,
      page,
      pageSize,
    });
    return json({ data: result.data, meta: result.meta });
  }

  if (path === '/api/v1/maintenance' && method === 'POST') {
    return jsonAsync(request, async (body: Record<string, unknown>) => {
      const mr = store.create('maintenance', {
        ...body,
        propertyId,
        referenceNumber: `MR-${randomUUID().slice(0, 6).toUpperCase()}`,
        status: 'open',
      });
      return json({ data: mr }, 201);
    });
  }

  if (path === '/api/v1/maintenance/categories' && method === 'GET') {
    return json({ data: store.getAll('maintenanceCategories', { where: { propertyId } }).data });
  }

  // --- Visitors ---------------------------------------------------------------
  if (path === '/api/v1/visitors' && method === 'GET') {
    const result = store.getAll('visitors', {
      where: { propertyId },
      search: search ? { fields: ['visitorName', 'comments'], query: search } : undefined,
      page,
      pageSize,
    });
    return json({ data: result.data, meta: result.meta });
  }

  if (path === '/api/v1/visitors' && method === 'POST') {
    return jsonAsync(request, async (body: Record<string, unknown>) => {
      const visitor = store.create('visitors', {
        ...body,
        propertyId,
        arrivalAt: new Date().toISOString(),
        departureAt: null,
      });
      return json({ data: visitor }, 201);
    });
  }

  // --- Announcements ----------------------------------------------------------
  if (path === '/api/v1/announcements' && method === 'GET') {
    const statusFilter = params.get('status') || undefined;
    const result = store.getAll('announcements', {
      where: { propertyId, ...(statusFilter ? { status: statusFilter } : {}) },
      search: search ? { fields: ['title', 'content'], query: search } : undefined,
      page,
      pageSize,
    });
    return json({ data: result.data, meta: result.meta });
  }

  if (path === '/api/v1/announcements' && method === 'POST') {
    return jsonAsync(request, async (body: Record<string, unknown>) => {
      const ann = store.create('announcements', { ...body, propertyId, status: 'draft' });
      return json({ data: ann }, 201);
    });
  }

  // --- Units ------------------------------------------------------------------
  if (path === '/api/v1/units' && method === 'GET') {
    const result = store.getAll('units', {
      where: { propertyId },
      search: search ? { fields: ['number'], query: search } : undefined,
      page,
      pageSize: parseInt(params.get('pageSize') || '100'),
    });
    return json({ data: result.data, meta: result.meta });
  }

  // GET /api/v1/units/:id — unit detail
  const unitMatch = path.match(/^\/api\/v1\/units\/([^/]+)$/);
  if (unitMatch && method === 'GET') {
    const unit = store.getById('units', unitMatch[1]!) as Record<string, unknown> | null;
    if (!unit) return json({ error: 'NOT_FOUND', message: 'Unit not found' }, 404);
    // Attach related packages and maintenance for the detail view
    const rawPackages = store.getAll('packages', { where: { unitId: unitMatch[1]! } })
      .data as Record<string, unknown>[];
    const rawMaintenance = store.getAll('maintenance', { where: { unitId: unitMatch[1]! } })
      .data as Record<string, unknown>[];

    // Map to the shape expected by UnitDetail interface on the page
    const buildingObj = unit.building as Record<string, string> | undefined;
    const mapped = {
      ...unit,
      // building must be a string (the page renders {unit.building} inline)
      building:
        buildingObj?.name ?? (typeof unit.building === 'string' ? unit.building : 'Main Tower'),
      // type comes from unitType in the store
      type: unit.unitType ?? unit.type ?? 'Unit',
      sqft: unit.sqft ?? 850,
      enterPhoneCode: unit.enterPhoneCode ?? '—',
      parkingSpot: unit.parkingSpot ?? '—',
      locker: unit.locker ?? '—',
      keyTag: unit.keyTag ?? '—',
      customFields: unit.customFields ?? {},
      // instructions: map from unitInstructions[]
      instructions: ((unit.unitInstructions ?? []) as Record<string, unknown>[]).map((ins) => ({
        id: ins.id ?? randomUUID(),
        text: ins.instructionText ?? ins.text ?? '',
        priority:
          ins.priority === 'high' ? 'critical' : ins.priority === 'medium' ? 'important' : 'normal',
        createdBy: 'Staff',
        createdAt: ins.createdAt ?? new Date().toISOString(),
      })),
      // packages: map courier object → string, createdAt → receivedAt
      packages: rawPackages.map((pkg) => ({
        id: pkg.id,
        referenceNumber: pkg.referenceNumber,
        courier:
          (pkg.courier as Record<string, string> | undefined)?.name ??
          String(pkg.courier ?? 'Unknown'),
        status: pkg.status,
        receivedAt: pkg.createdAt,
        releasedTo: pkg.releasedTo ?? null,
      })),
      // maintenance: map category object → string, maintenanceRequests → maintenance
      maintenance: rawMaintenance.map((mr) => ({
        id: mr.id,
        referenceNumber: mr.referenceNumber,
        category:
          (mr.category as Record<string, string> | undefined)?.name ??
          String(mr.category ?? 'General'),
        status: mr.status,
        priority: mr.priority,
        createdAt: mr.createdAt,
      })),
      occupants: [],
      pets: [],
      vehicles: [],
      fobs: [],
      buzzerCodes: [],
      garageClickers: [],
      emergencyContacts: [],
      history: [],
    };
    return json({ data: mapped });
  }

  // --- Resident Packages -------------------------------------------------------
  if (path === '/api/v1/resident/packages' && method === 'GET') {
    // Resident unit: unit 101 (00000000-0000-4000-d000-0000unit0101) for demo
    const residentUnitId = '00000000-0000-4000-d000-0000unit0101';
    const statusFilter = params.get('status') || undefined;
    const result = store.getAll('packages', {
      where: {
        propertyId,
        unitId: residentUnitId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      page,
      pageSize,
    });
    return json({ data: result.data, meta: result.meta });
  }

  // --- Amenities --------------------------------------------------------------
  if (path === '/api/v1/amenities' && method === 'GET') {
    const result = store.getAll('amenities', {
      where: { propertyId },
      search: search ? { fields: ['name', 'description'], query: search } : undefined,
    });
    return json({ data: result.data });
  }

  if (path === '/api/v1/bookings' && method === 'GET') {
    return json({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });
  }

  // --- Events -----------------------------------------------------------------
  if (path === '/api/v1/events' && method === 'GET') {
    const statusFilter = params.get('status') || undefined;
    const result = store.getAll('events', {
      where: { propertyId, ...(statusFilter ? { status: statusFilter } : {}) },
      search: search
        ? { fields: ['title', 'description', 'referenceNo'], query: search }
        : undefined,
      page,
      pageSize,
    });
    return json({ data: result.data, meta: result.meta });
  }

  if (path === '/api/v1/event-types' && method === 'GET') {
    return json({ data: store.getAll('eventTypes', { where: { propertyId } }).data });
  }

  if (path === '/api/v1/event-groups' && method === 'GET') {
    return json({
      data: [
        { id: 'eg01', name: 'Security', slug: 'security', eventTypes: [] },
        { id: 'eg02', name: 'Packages', slug: 'packages', eventTypes: [] },
        { id: 'eg03', name: 'Maintenance', slug: 'maintenance', eventTypes: [] },
        { id: 'eg04', name: 'Communication', slug: 'communication', eventTypes: [] },
        { id: 'eg05', name: 'Community', slug: 'community', eventTypes: [] },
      ],
    });
  }

  // --- Shift Log --------------------------------------------------------------
  if (path === '/api/v1/shift-log' && method === 'GET') {
    const result = store.getAll('shiftLog', {
      where: { propertyId },
      page,
      pageSize: parseInt(params.get('pageSize') || '20'),
    });
    return json({ data: result.data, meta: result.meta });
  }

  if (path === '/api/v1/shift-log' && method === 'POST') {
    return jsonAsync(request, async (body: Record<string, unknown>) => {
      const entry = store.create('shiftLog', {
        ...body,
        propertyId,
        referenceNo: `SL-${randomUUID().slice(0, 8).toUpperCase()}`,
      });
      return json({ data: entry }, 201);
    });
  }

  // --- Training ---------------------------------------------------------------
  // Let training requests pass through to the real database so that
  // course creation (POST) and listing (GET) stay consistent.
  // Previously, GET returned from the demo store while POST wrote to the
  // real DB, causing newly-created courses to never appear in the UI.

  // --- Compliance -------------------------------------------------------------
  if (path === '/api/v1/compliance/dashboard' || path === '/api/v1/compliance') {
    const comp = store.getAll('compliance', { where: { propertyId } });
    if (comp.data.length > 0) {
      return json({ data: comp.data[0] });
    }
    return json({ data: { overallScore: 0, frameworks: {}, recentViolations: [] } });
  }

  // --- Reports ----------------------------------------------------------------
  if (path === '/api/v1/reports' && method === 'GET') {
    const reportType = params.get('type');
    if (!reportType) {
      return json({ data: { availableReports: store.getAll('reports').data } });
    }
    // Return summary for specific report type
    return json({
      data: {
        summary: { total: 0, generated: new Date().toISOString() },
        records: [],
      },
    });
  }

  // --- Keys / FOBs ------------------------------------------------------------
  if (path === '/api/v1/keys' && method === 'GET') {
    const result = store.getAll('keys', {
      where: { propertyId },
      search: search ? { fields: ['keyName', 'keyNumber', 'keyOwner'], query: search } : undefined,
      page,
      pageSize,
    });
    return json({ data: result.data, meta: result.meta });
  }

  // --- Parking ----------------------------------------------------------------
  if (path === '/api/v1/parking' && method === 'GET') {
    const type = params.get('type') || 'permits';
    if (type === 'violations') {
      return json({ data: store.getAll('parkingViolations', { where: { propertyId } }).data });
    }
    return json({ data: store.getAll('parkingPermits', { where: { propertyId } }).data });
  }

  // --- Settings ---------------------------------------------------------------
  if (path === '/api/v1/settings' && method === 'GET') {
    return json({
      data: {
        property: {
          id: propertyId,
          name: 'Maple Heights Condominiums',
          address: '100 Maple Avenue',
          city: 'Toronto',
          province: 'Ontario',
          country: 'CA',
          postalCode: 'M5V 2H1',
          timezone: 'America/Toronto',
          unitCount: 200,
          logo: null,
          branding: { accentColor: '#1e40af' },
        },
        eventTypes: store.getAll('eventTypes', { where: { propertyId } }).data,
      },
    });
  }

  if (path.startsWith('/api/v1/settings') && (method === 'PATCH' || method === 'PUT')) {
    return jsonAsync(request, async (body: Record<string, unknown>) => {
      const existing = store.getAll('settings', { where: { propertyId } });
      if (existing.data.length > 0) {
        const updated = store.update('settings', existing.data[0]!.id as string, body);
        return json({ data: updated, message: 'Settings updated' });
      }
      const created = store.create('settings', { ...body, propertyId });
      return json({ data: created, message: 'Settings updated' });
    });
  }

  // --- Building Directory -----------------------------------------------------
  if (path === '/api/v1/building-directory' && method === 'GET') {
    return json({ data: store.getAll('buildingDirectory', { where: { propertyId } }).data });
  }

  // --- Digital Signage --------------------------------------------------------
  if (path === '/api/v1/digital-signage' && method === 'GET') {
    return json({ data: store.getAll('digitalSignage', { where: { propertyId } }).data });
  }

  // --- Vendors ----------------------------------------------------------------
  if (path === '/api/v1/vendors' && method === 'GET') {
    const isSummary = params.get('summary') === 'compliance';
    if (isSummary) {
      return json({
        data: {
          compliant: 18,
          not_compliant: 3,
          expiring: 5,
          expired: 2,
          not_tracking: 6,
          total: 34,
        },
      });
    }
    return json({ data: [], meta: { page: 1, pageSize: 50, total: 0, totalPages: 0 } });
  }

  // --- Community Events -------------------------------------------------------
  if (path === '/api/v1/community/events' && method === 'GET') {
    return json({
      data: [
        {
          id: 'ce01',
          propertyId,
          title: 'Spring Social BBQ',
          description: 'Join us for food, drinks, and community on the rooftop!',
          location: 'Rooftop Terrace',
          locationType: 'on_site',
          virtualUrl: null,
          startDatetime: new Date(Date.now() + 56 * 24 * 3600_000).toISOString(),
          endDatetime: new Date(Date.now() + 56 * 24 * 3600_000 + 7200_000).toISOString(),
          capacity: 100,
          rsvpEnabled: true,
          status: 'published',
          createdAt: new Date(Date.now() - 7 * 24 * 3600_000).toISOString(),
          rsvps: [],
        },
        {
          id: 'ce02',
          propertyId,
          title: 'Movie Night — The Grand Budapest Hotel',
          description: 'Popcorn and drinks provided. RSVP required.',
          location: 'Theatre Room',
          locationType: 'on_site',
          virtualUrl: null,
          startDatetime: new Date(Date.now() + 14 * 24 * 3600_000).toISOString(),
          endDatetime: new Date(Date.now() + 14 * 24 * 3600_000 + 7200_000).toISOString(),
          capacity: 20,
          rsvpEnabled: true,
          status: 'published',
          createdAt: new Date(Date.now() - 3 * 24 * 3600_000).toISOString(),
          rsvps: [],
        },
      ],
    });
  }

  // --- Onboarding -------------------------------------------------------------
  if (path === '/api/v1/onboarding' && method === 'GET') {
    return json({
      data: {
        currentStep: 1,
        completedSteps: [],
        skippedSteps: [],
        percentComplete: 0,
        isComplete: false,
      },
    });
  }

  // --- Audit Log --------------------------------------------------------------
  if (path === '/api/v1/audit-log' && method === 'GET') {
    return json({
      data: [
        {
          id: 'al01',
          action: 'user.login',
          actor: 'Sarah Chen',
          details: 'Logged in from 192.168.1.100',
          timestamp: new Date(Date.now() - 3600_000).toISOString(),
        },
        {
          id: 'al02',
          action: 'package.create',
          actor: 'Mike Johnson',
          details: 'Created package PKG-MH2401 for Unit 101',
          timestamp: new Date(Date.now() - 1800_000).toISOString(),
        },
        {
          id: 'al03',
          action: 'visitor.checkin',
          actor: 'Raj Patel',
          details: 'Checked in contractor Mike Plumber for Unit 301',
          timestamp: new Date(Date.now() - 3600_000).toISOString(),
        },
        {
          id: 'al04',
          action: 'announcement.publish',
          actor: 'Sarah Chen',
          details: 'Published "Pool Maintenance — Temporary Closure"',
          timestamp: new Date(Date.now() - 43200_000).toISOString(),
        },
        {
          id: 'al05',
          action: 'settings.update',
          actor: 'Platform Admin',
          details: 'Updated notification preferences',
          timestamp: new Date(Date.now() - 86400_000).toISOString(),
        },
      ],
      meta: { page: 1, pageSize: 20, total: 5, totalPages: 1 },
    });
  }

  // --- Search -----------------------------------------------------------------
  if (path === '/api/v1/search' && method === 'GET') {
    const q = params.get('q') || params.get('query') || '';
    if (!q) {
      return json({
        data: {
          users: [],
          units: [],
          packages: [],
          events: [],
          announcements: [],
          results: [],
          total: 0,
        },
        meta: { query: '', resultCount: 0 },
      });
    }
    // Search across demo store entities
    const users = store
      .getAll('users', { search: { fields: ['firstName', 'lastName', 'email'], query: q } })
      .data.slice(0, 5);
    const packages = store
      .getAll('packages', { search: { fields: ['referenceNumber', 'trackingNumber'], query: q } })
      .data.slice(0, 5);
    const events = store
      .getAll('events', { search: { fields: ['title', 'description'], query: q } })
      .data.slice(0, 5);
    const announcements = store
      .getAll('announcements', { search: { fields: ['title', 'content'], query: q } })
      .data.slice(0, 5);
    const allResults = [...users, ...packages, ...events, ...announcements];
    return json({
      data: {
        users,
        units: [],
        packages,
        events,
        announcements,
        results: allResults,
        total: allResults.length,
      },
      meta: { query: q, resultCount: allResults.length },
    });
  }

  // --- Notifications ----------------------------------------------------------
  if (path === '/api/v1/notifications' && method === 'GET') {
    return json({
      data: [
        {
          id: 'n01',
          type: 'package',
          title: 'New package for Unit 101',
          read: false,
          createdAt: new Date(Date.now() - 1800_000).toISOString(),
        },
        {
          id: 'n02',
          type: 'maintenance',
          title: 'Urgent: No heating in Unit 102',
          read: false,
          createdAt: new Date(Date.now() - 10800_000).toISOString(),
        },
        {
          id: 'n03',
          type: 'visitor',
          title: 'Contractor arrived for Unit 301',
          read: true,
          createdAt: new Date(Date.now() - 3600_000).toISOString(),
        },
        {
          id: 'n04',
          type: 'announcement',
          title: 'Fire Drill — March 28',
          read: true,
          createdAt: new Date(Date.now() - 86400_000).toISOString(),
        },
      ],
      meta: { unreadCount: 2 },
    });
  }

  // No match — return null to let catch-all in handleDemoRequest handle it
  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

async function jsonAsync(
  request: NextRequest,
  handler: (body: Record<string, unknown>) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const body = await request.json();
    return handler(body);
  } catch {
    return json({ error: 'INVALID_BODY', message: 'Invalid request body' }, 400);
  }
}
