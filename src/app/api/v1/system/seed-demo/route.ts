/**
 * Seed Demo — Populate Parkview Terrace with realistic demo data
 * POST /api/v1/system/seed-demo
 *
 * Idempotent: safe to run multiple times (uses upsert on emails / reference numbers).
 * Requires super_admin or property_admin role via x-demo-role header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '94fd28bd-37ce-4fb1-952e-4c182634fc90';

async function hashPassword(password: string): Promise<string> {
  const argon2 = await import('argon2');
  return argon2.hash(password, {
    type: 2, // argon2id
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

// ---------------------------------------------------------------------------
// Resident definitions
// ---------------------------------------------------------------------------

const RESIDENTS = [
  { firstName: 'Priya', lastName: 'Sharma', phone: '416-555-0101', unit: '102', type: 'owner' },
  { firstName: 'Liam', lastName: 'Chen', phone: '416-555-0102', unit: '201', type: 'tenant' },
  { firstName: 'Fatima', lastName: 'Al-Hassan', phone: '416-555-0103', unit: '202', type: 'owner' },
  { firstName: 'Marcus', lastName: 'Williams', phone: '416-555-0104', unit: '301', type: 'tenant' },
  { firstName: 'Sofia', lastName: 'Rodriguez', phone: '416-555-0105', unit: '302', type: 'owner' },
  { firstName: 'James', lastName: "O'Brien", phone: '416-555-0106', unit: '401', type: 'tenant' },
  { firstName: 'Yuki', lastName: 'Tanaka', phone: '416-555-0107', unit: '402', type: 'owner' },
  { firstName: 'Amara', lastName: 'Okafor', phone: '416-555-0108', unit: '501', type: 'tenant' },
  { firstName: 'David', lastName: 'Kim', phone: '416-555-0109', unit: '502', type: 'owner' },
  { firstName: 'Elena', lastName: 'Petrov', phone: '416-555-0110', unit: '503', type: 'tenant' },
] as const;

// ---------------------------------------------------------------------------
// Package definitions
// ---------------------------------------------------------------------------

interface PkgDef {
  ref: string;
  courier: string;
  status: string;
  isPerishable: boolean;
  isOversized: boolean;
  desc: string;
  daysAgo: number;
  released: boolean;
}

const PACKAGES: PkgDef[] = [
  // 8 unreleased (today/yesterday)
  {
    ref: 'PKG-SEED-001',
    courier: 'amazon',
    status: 'unreleased',
    isPerishable: false,
    isOversized: false,
    desc: 'Small cardboard box',
    daysAgo: 0,
    released: false,
  },
  {
    ref: 'PKG-SEED-002',
    courier: 'fedex',
    status: 'unreleased',
    isPerishable: false,
    isOversized: false,
    desc: 'Document envelope',
    daysAgo: 0,
    released: false,
  },
  {
    ref: 'PKG-SEED-003',
    courier: 'ups',
    status: 'unreleased',
    isPerishable: false,
    isOversized: false,
    desc: 'Medium box — clothing',
    daysAgo: 0,
    released: false,
  },
  {
    ref: 'PKG-SEED-004',
    courier: 'canada-post',
    status: 'unreleased',
    isPerishable: false,
    isOversized: false,
    desc: 'Registered letter',
    daysAgo: 0,
    released: false,
  },
  {
    ref: 'PKG-SEED-005',
    courier: 'amazon',
    status: 'unreleased',
    isPerishable: false,
    isOversized: false,
    desc: 'Large box — electronics',
    daysAgo: 1,
    released: false,
  },
  {
    ref: 'PKG-SEED-006',
    courier: 'dhl',
    status: 'unreleased',
    isPerishable: false,
    isOversized: false,
    desc: 'International parcel',
    daysAgo: 1,
    released: false,
  },
  {
    ref: 'PKG-SEED-007',
    courier: 'fedex',
    status: 'unreleased',
    isPerishable: false,
    isOversized: false,
    desc: 'Priority overnight envelope',
    daysAgo: 0,
    released: false,
  },
  {
    ref: 'PKG-SEED-008',
    courier: 'ups',
    status: 'unreleased',
    isPerishable: false,
    isOversized: false,
    desc: 'Multi-box shipment (1 of 2)',
    daysAgo: 1,
    released: false,
  },
  // 7 released (past week)
  {
    ref: 'PKG-SEED-009',
    courier: 'amazon',
    status: 'released',
    isPerishable: false,
    isOversized: false,
    desc: 'Kitchen supplies',
    daysAgo: 2,
    released: true,
  },
  {
    ref: 'PKG-SEED-010',
    courier: 'canada-post',
    status: 'released',
    isPerishable: false,
    isOversized: false,
    desc: 'Government letter',
    daysAgo: 3,
    released: true,
  },
  {
    ref: 'PKG-SEED-011',
    courier: 'fedex',
    status: 'released',
    isPerishable: false,
    isOversized: false,
    desc: 'Pharmaceutical delivery',
    daysAgo: 4,
    released: true,
  },
  {
    ref: 'PKG-SEED-012',
    courier: 'dhl',
    status: 'released',
    isPerishable: false,
    isOversized: false,
    desc: 'International gift package',
    daysAgo: 5,
    released: true,
  },
  {
    ref: 'PKG-SEED-013',
    courier: 'ups',
    status: 'released',
    isPerishable: false,
    isOversized: false,
    desc: 'Office chair parts',
    daysAgo: 5,
    released: true,
  },
  {
    ref: 'PKG-SEED-014',
    courier: 'amazon',
    status: 'released',
    isPerishable: false,
    isOversized: false,
    desc: 'Books and stationery',
    daysAgo: 6,
    released: true,
  },
  {
    ref: 'PKG-SEED-015',
    courier: 'canada-post',
    status: 'released',
    isPerishable: false,
    isOversized: false,
    desc: 'Subscription box',
    daysAgo: 7,
    released: true,
  },
  // 3 perishable
  {
    ref: 'PKG-SEED-016',
    courier: 'amazon',
    status: 'unreleased',
    isPerishable: true,
    isOversized: false,
    desc: 'Amazon Fresh — groceries (PERISHABLE)',
    daysAgo: 0,
    released: false,
  },
  {
    ref: 'PKG-SEED-017',
    courier: 'fedex',
    status: 'unreleased',
    isPerishable: true,
    isOversized: false,
    desc: 'Fresh flowers — perishable',
    daysAgo: 0,
    released: false,
  },
  {
    ref: 'PKG-SEED-018',
    courier: 'ups',
    status: 'unreleased',
    isPerishable: true,
    isOversized: false,
    desc: 'Meal kit delivery (PERISHABLE)',
    daysAgo: 0,
    released: false,
  },
  // 2 oversized
  {
    ref: 'PKG-SEED-019',
    courier: 'fedex',
    status: 'unreleased',
    isPerishable: false,
    isOversized: true,
    desc: 'Oversized — 65" TV',
    daysAgo: 1,
    released: false,
  },
  {
    ref: 'PKG-SEED-020',
    courier: 'ups',
    status: 'unreleased',
    isPerishable: false,
    isOversized: true,
    desc: 'Oversized — exercise bike',
    daysAgo: 0,
    released: false,
  },
];

// ---------------------------------------------------------------------------
// Maintenance request definitions
// ---------------------------------------------------------------------------

interface MaintDef {
  title: string;
  description: string;
  categoryName: string;
  priority: string;
  status: string;
  daysAgo: number;
}

const MAINTENANCE_REQUESTS: MaintDef[] = [
  {
    title: 'Leaking bathroom faucet',
    description:
      'Persistent drip from the hot water tap in the master bathroom. Water pooling on counter.',
    categoryName: 'Plumbing',
    priority: 'high',
    status: 'open',
    daysAgo: 1,
  },
  {
    title: 'Hallway light burnt out - Floor 3',
    description:
      'The ceiling light near the elevator on Floor 3 has been out for two days. Very dark at night.',
    categoryName: 'Electrical',
    priority: 'low',
    status: 'open',
    daysAgo: 3,
  },
  {
    title: 'HVAC making loud noise',
    description:
      'Unit HVAC system making a rattling/grinding noise when heating kicks in. Started this week.',
    categoryName: 'HVAC',
    priority: 'normal',
    status: 'in_progress',
    daysAgo: 4,
  },
  {
    title: 'Dishwasher not draining',
    description: 'Dishwasher fills but does not drain at end of cycle. Standing water at bottom.',
    categoryName: 'Appliance',
    priority: 'normal',
    status: 'open',
    daysAgo: 2,
  },
  {
    title: 'Crack in parking garage ceiling',
    description:
      'Visible crack approximately 2 feet long in P1 level ceiling near spot 42. Some moisture seeping through.',
    categoryName: 'Structural',
    priority: 'critical',
    status: 'open',
    daysAgo: 0,
  },
  {
    title: 'Mouse spotted in garbage room',
    description:
      'Mouse seen in the garbage chute room on Floor 2 at approximately 10pm. Droppings found near bins.',
    categoryName: 'Pest Control',
    priority: 'high',
    status: 'open',
    daysAgo: 1,
  },
  {
    title: 'Intercom not working - Unit 201',
    description:
      'Intercom buzzer does not ring when visitors press the unit button. No audio at all.',
    categoryName: 'General',
    priority: 'normal',
    status: 'closed',
    daysAgo: 10,
  },
  {
    title: 'Elevator B stuck on Floor 4',
    description:
      'Elevator B doors will not open on Floor 4. Display shows Floor 4 but car is unresponsive. Other floors working.',
    categoryName: 'General',
    priority: 'critical',
    status: 'in_progress',
    daysAgo: 0,
  },
  {
    title: "Balcony door won't lock",
    description:
      'Sliding balcony door lock mechanism is broken. Door closes but cannot be secured. Security concern.',
    categoryName: 'General',
    priority: 'high',
    status: 'open',
    daysAgo: 2,
  },
  {
    title: 'Hot water intermittent - Floors 3-5',
    description:
      'Multiple units on Floors 3-5 reporting intermittent hot water. Cold for 30-60 seconds then returns. Boiler issue suspected.',
    categoryName: 'Plumbing',
    priority: 'critical',
    status: 'open',
    daysAgo: 0,
  },
];

// ---------------------------------------------------------------------------
// Announcement definitions
// ---------------------------------------------------------------------------

const ANNOUNCEMENTS = [
  {
    title: 'Annual Fire Drill \u2014 April 25',
    content:
      '<p>The annual fire drill is scheduled for <strong>Friday, April 25 at 10:00 AM</strong>. All residents must evacuate the building when the alarm sounds. Please proceed to the designated assembly point in the east parking lot. The drill will last approximately 30 minutes.</p>',
    priority: 'high',
    status: 'published',
    publishedAt: new Date(),
  },
  {
    title: 'Pool Opening for Summer Season',
    content:
      '<p>The rooftop pool and sun deck will reopen for the summer season on <strong>Thursday, May 1</strong>. Hours of operation: 7:00 AM \u2013 10:00 PM daily. Pool passes are available at the front desk. Residents must present their FOB for access.</p>',
    priority: 'normal',
    status: 'scheduled',
    scheduledAt: new Date('2026-05-01T09:00:00'),
    publishedAt: null,
  },
  {
    title: 'Elevator B Maintenance \u2014 April 18',
    content:
      '<p><strong>URGENT:</strong> Elevator B will be out of service on <strong>Friday, April 18 from 8:00 AM to 5:00 PM</strong> for emergency maintenance. Please use Elevator A during this time. We apologize for the inconvenience.</p>',
    priority: 'urgent',
    status: 'published',
    publishedAt: new Date(),
  },
];

// ---------------------------------------------------------------------------
// Security incident definitions
// ---------------------------------------------------------------------------

const SECURITY_INCIDENTS = [
  {
    title: 'Noise complaint - Unit 302',
    type: 'noise_complaint',
    body: 'Loud music reported from Unit 302 at 11:45 PM. Resident asked to lower volume. Complied on first request.',
    urgency: false,
  },
  {
    title: 'Tailgating at main entrance',
    type: 'trespassing',
    body: 'Unknown individual entered the main lobby by tailgating a resident at 2:30 PM. Individual was stopped at the elevator and asked to sign in. Left the building voluntarily.',
    urgency: true,
  },
  {
    title: 'Broken window - Lobby',
    type: 'vandalism',
    body: 'Small crack found in the lobby front window near the mailbox area. Appears to be impact damage. No witnesses. Reported to property management for repair.',
    urgency: true,
  },
  {
    title: 'Suspicious vehicle in P2',
    type: 'suspicious_activity',
    body: 'Dark sedan with no parking permit observed idling in P2 visitor area for over 45 minutes. License plate recorded. Vehicle departed at 9:15 PM.',
    urgency: false,
  },
  {
    title: 'Fire alarm - false alarm, cooking smoke Floor 4',
    type: 'fire_safety',
    body: 'Fire alarm triggered on Floor 4 at 6:20 PM. Investigation determined cause was cooking smoke from Unit 403. Alarm reset. No fire department dispatch required.',
    urgency: false,
  },
];

// Incident type slugs mapped to display names
const INCIDENT_TYPE_DEFS: { slug: string; name: string; defaultPriority: string }[] = [
  { slug: 'noise_complaint', name: 'Noise Complaint', defaultPriority: 'low' },
  { slug: 'trespassing', name: 'Trespassing', defaultPriority: 'high' },
  { slug: 'vandalism', name: 'Vandalism', defaultPriority: 'high' },
  { slug: 'suspicious_activity', name: 'Suspicious Activity', defaultPriority: 'normal' },
  { slug: 'fire_safety', name: 'Fire / Safety', defaultPriority: 'high' },
];

// ---------------------------------------------------------------------------
// Key inventory definitions
// ---------------------------------------------------------------------------

const KEY_INVENTORY = [
  { name: 'Master Key - Main Entrance', number: 'MK-001', category: 'master' as const },
  { name: 'Master Key - Mechanical Room', number: 'MK-002', category: 'master' as const },
  { name: 'FOB-001', number: 'FOB-001', category: 'common_area' as const },
  { name: 'FOB-002', number: 'FOB-002', category: 'common_area' as const },
  { name: 'FOB-003', number: 'FOB-003', category: 'common_area' as const },
  { name: 'FOB-004', number: 'FOB-004', category: 'common_area' as const },
  { name: 'FOB-005', number: 'FOB-005', category: 'common_area' as const },
  { name: 'Unit Key - 201', number: 'UK-201', category: 'unit' as const },
  { name: 'Unit Key - 301', number: 'UK-301', category: 'unit' as const },
  { name: 'Unit Key - 401', number: 'UK-401', category: 'unit' as const },
];

// ---------------------------------------------------------------------------
// Vendor definitions
// ---------------------------------------------------------------------------

const VENDORS = [
  {
    company: 'Toronto Elevator Services',
    category: 'Elevator',
    contactName: 'James Park',
    phone: '416-555-8800',
    email: 'service@torontoelevator.ca',
  },
  {
    company: 'GreenLeaf Pest Control',
    category: 'Pest Control',
    contactName: 'Sarah Kim',
    phone: '416-555-8801',
    email: 'info@greenleafpest.ca',
  },
];

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Production guard — block in production unless explicitly allowed
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SYSTEM_ROUTES) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  // Auth: require super_admin or property_admin via demo header
  const demoRole = request.headers.get('x-demo-role');
  if (demoRole !== 'super_admin' && demoRole !== 'property_admin') {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Requires super_admin or property_admin role.' },
      { status: 403 },
    );
  }

  try {
    const propertyId = PROPERTY_ID;

    // -----------------------------------------------------------------------
    // Look up property and first staff user for createdById
    // -----------------------------------------------------------------------
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: `Property ${propertyId} does not exist. Run the main seed first.`,
        },
        { status: 404 },
      );
    }

    const staffUser = await prisma.user.findFirst({
      where: { userProperties: { some: { propertyId } } },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!staffUser) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: 'No staff user found for this property. Run the main seed first.',
        },
        { status: 404 },
      );
    }
    const createdById = staffUser.id;

    // Fetch existing units for this property
    const units = await prisma.unit.findMany({
      where: { propertyId },
      select: { id: true, number: true },
      orderBy: { number: 'asc' },
    });
    const unitByNumber = new Map(units.map((u) => [u.number, u.id]));
    const unitIds = units.map((u) => u.id);

    // Fetch resident roles (resident_owner / resident_tenant) for UserProperty
    const residentOwnerRole = await prisma.role.findFirst({
      where: { propertyId, slug: 'resident_owner' },
      select: { id: true },
    });
    const residentTenantRole = await prisma.role.findFirst({
      where: { propertyId, slug: 'resident_tenant' },
      select: { id: true },
    });

    const now = new Date();
    const residentHash = await hashPassword('Resident123!@');

    // -----------------------------------------------------------------------
    // 1. RESIDENTS — create users + occupancy
    // -----------------------------------------------------------------------
    let residentsCreated = 0;
    const residentUserIds: string[] = [];

    for (const r of RESIDENTS) {
      const email = `${r.firstName.toLowerCase()}.${r.lastName.toLowerCase().replace(/'/g, '')}@gmail.com`;
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          firstName: r.firstName,
          lastName: r.lastName,
          phone: r.phone,
          isActive: true,
        },
        create: {
          email,
          passwordHash: residentHash,
          firstName: r.firstName,
          lastName: r.lastName,
          phone: r.phone,
          isActive: true,
          activatedAt: now,
          mfaEnabled: false,
        },
      });
      residentUserIds.push(user.id);

      // UserProperty — link user to property with the right role
      const roleId = r.type === 'owner' ? residentOwnerRole?.id : residentTenantRole?.id;

      if (roleId) {
        await prisma.userProperty.upsert({
          where: { userId_propertyId: { userId: user.id, propertyId } },
          update: { roleId },
          create: { userId: user.id, propertyId, roleId },
        });
      }

      // Unit — ensure it exists
      let unitId = unitByNumber.get(r.unit);
      if (!unitId) {
        const floorNum = parseInt(r.unit.slice(0, -2), 10) || 1;
        const newUnit = await prisma.unit.create({
          data: {
            propertyId,
            number: r.unit,
            floor: floorNum,
            unitType: 'residential',
            status: 'occupied',
          },
        });
        unitId = newUnit.id;
        unitByNumber.set(r.unit, unitId);
        unitIds.push(unitId);
      } else {
        // Mark occupied
        await prisma.unit.update({ where: { id: unitId }, data: { status: 'occupied' } });
      }

      // Occupancy record — upsert by checking existing
      const existingOcc = await prisma.occupancyRecord.findFirst({
        where: { unitId, userId: user.id, propertyId, moveOutDate: null },
      });
      if (!existingOcc) {
        await prisma.occupancyRecord.create({
          data: {
            unitId,
            userId: user.id,
            propertyId,
            residentType: r.type,
            moveInDate: new Date('2024-09-01'),
            isPrimary: true,
            recordedById: createdById,
          },
        });
      }

      residentsCreated++;
    }

    // -----------------------------------------------------------------------
    // 2. PACKAGES
    // -----------------------------------------------------------------------
    let packagesCreated = 0;

    // Fetch courier map
    const couriers = await prisma.courierType.findMany({
      where: { isActive: true },
      select: { id: true, slug: true },
    });
    const courierBySlug = new Map(couriers.map((c) => [c.slug, c.id]));

    // Fetch storage spots
    const storageSpots = await prisma.storageSpot.findMany({
      where: { propertyId, isActive: true },
      select: { id: true, code: true },
    });
    const storageByCode = new Map(storageSpots.map((s) => [s.code, s.id]));

    for (let i = 0; i < PACKAGES.length; i++) {
      const pkg = PACKAGES[i]!;
      const unitId = unitIds[i % unitIds.length]!;
      const courierId = courierBySlug.get(pkg.courier) ?? null;
      const createdAt = new Date(now.getTime() - pkg.daysAgo * 24 * 60 * 60 * 1000);
      const releasedAt = pkg.released ? new Date(createdAt.getTime() + 4 * 60 * 60 * 1000) : null;

      // Pick storage spot based on type
      let storageSpotId: string | null = null;
      if (pkg.isPerishable) storageSpotId = storageByCode.get('FR') ?? null;
      else if (pkg.isOversized) storageSpotId = storageByCode.get('OS') ?? null;
      else storageSpotId = storageByCode.get('PR') ?? null;

      // Upsert by reference number (unique within property)
      const existing = await prisma.package.findFirst({
        where: { propertyId, referenceNumber: pkg.ref },
      });

      if (existing) {
        await prisma.package.update({
          where: { id: existing.id },
          data: {
            status: pkg.status,
            description: pkg.desc,
            isPerishable: pkg.isPerishable,
            isOversized: pkg.isOversized,
          },
        });
      } else {
        await prisma.package.create({
          data: {
            propertyId,
            unitId,
            referenceNumber: pkg.ref,
            direction: 'incoming',
            status: pkg.status,
            courierId,
            description: pkg.desc,
            storageSpotId,
            isPerishable: pkg.isPerishable,
            isOversized: pkg.isOversized,
            createdById,
            releasedById: pkg.released ? createdById : null,
            releasedAt,
            releasedToName: pkg.released ? 'Resident' : null,
            createdAt,
          },
        });
      }
      packagesCreated++;
    }

    // -----------------------------------------------------------------------
    // 3. MAINTENANCE REQUESTS
    // -----------------------------------------------------------------------
    let maintenanceCreated = 0;

    // Fetch maintenance categories for this property
    const categories = await prisma.maintenanceCategory.findMany({
      where: { propertyId, isActive: true },
      select: { id: true, name: true },
    });
    const catByName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

    // Fallback: use "General" if specific category not found
    const generalCatId = catByName.get('general');

    for (let i = 0; i < MAINTENANCE_REQUESTS.length; i++) {
      const mr = MAINTENANCE_REQUESTS[i]!;
      const refNum = `SR-2026-SEED${(i + 1).toString().padStart(2, '0')}`;
      const unitId = unitIds[i % unitIds.length]!;
      const residentId = residentUserIds[i % residentUserIds.length] ?? createdById;
      const categoryId = catByName.get(mr.categoryName.toLowerCase()) ?? generalCatId;

      if (!categoryId) continue; // skip if no categories at all

      const createdAt = new Date(now.getTime() - mr.daysAgo * 24 * 60 * 60 * 1000);

      // Map status names
      const statusMap: Record<string, string> = {
        open: 'open',
        in_progress: 'in_progress',
        assigned: 'in_progress',
        resolved: 'closed',
        closed: 'closed',
      };
      const status = statusMap[mr.status.toLowerCase()] ?? 'open';

      const existing = await prisma.maintenanceRequest.findFirst({
        where: { propertyId, referenceNumber: refNum },
      });

      if (!existing) {
        await prisma.maintenanceRequest.create({
          data: {
            propertyId,
            unitId,
            residentId,
            referenceNumber: refNum,
            categoryId,
            title: mr.title,
            description: mr.description,
            status,
            priority: mr.priority,
            urgencyFlag: mr.priority === 'critical',
            permissionToEnter: 'yes',
            source: 'resident',
            dateReported: createdAt,
            completedDate:
              status === 'closed' ? new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000) : null,
            resolutionNotes:
              status === 'closed' ? 'Issue resolved and verified by maintenance staff.' : null,
            createdAt,
          },
        });
        maintenanceCreated++;
      }
    }

    // -----------------------------------------------------------------------
    // 4. ANNOUNCEMENTS
    // -----------------------------------------------------------------------
    let announcementsCreated = 0;

    for (const ann of ANNOUNCEMENTS) {
      const existing = await prisma.announcement.findFirst({
        where: { propertyId, title: ann.title },
      });

      if (!existing) {
        await prisma.announcement.create({
          data: {
            propertyId,
            title: ann.title,
            content: ann.content,
            priority: ann.priority,
            status: ann.status,
            channels: ['web', 'email'],
            createdById,
            publishedAt: ann.publishedAt ?? undefined,
            scheduledAt: ann.scheduledAt ?? undefined,
          },
        });
        announcementsCreated++;
      }
    }

    // -----------------------------------------------------------------------
    // 5. SECURITY EVENTS (IncidentReport + IncidentType)
    // -----------------------------------------------------------------------
    let securityEventsCreated = 0;

    // Ensure incident types exist
    const incidentTypeMap = new Map<string, string>();
    for (const itDef of INCIDENT_TYPE_DEFS) {
      let it = await prisma.incidentType.findFirst({
        where: { slug: itDef.slug, OR: [{ propertyId }, { propertyId: null }] },
      });
      if (!it) {
        it = await prisma.incidentType.create({
          data: {
            propertyId,
            name: itDef.name,
            slug: itDef.slug,
            defaultPriority: itDef.defaultPriority,
            isActive: true,
          },
        });
      }
      incidentTypeMap.set(itDef.slug, it.id);
    }

    for (let i = 0; i < SECURITY_INCIDENTS.length; i++) {
      const si = SECURITY_INCIDENTS[i]!;
      const incidentTypeId = incidentTypeMap.get(si.type);
      if (!incidentTypeId) continue;

      const existing = await prisma.incidentReport.findFirst({
        where: { propertyId, title: si.title },
      });

      if (!existing) {
        const timeOccurred = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        await prisma.incidentReport.create({
          data: {
            propertyId,
            incidentTypeId,
            title: si.title,
            reportBody: si.body,
            timeOccurred,
            urgency: si.urgency,
          },
        });
        securityEventsCreated++;
      }
    }

    // -----------------------------------------------------------------------
    // 6. KEY INVENTORY
    // -----------------------------------------------------------------------
    let keysCreated = 0;

    for (const key of KEY_INVENTORY) {
      const existing = await prisma.keyInventory.findFirst({
        where: { propertyId, keyNumber: key.number },
      });

      if (!existing) {
        await prisma.keyInventory.create({
          data: {
            propertyId,
            keyName: key.name,
            keyNumber: key.number,
            category: key.category,
            status: 'available',
            createdById,
          },
        });
        keysCreated++;
      }
    }

    // -----------------------------------------------------------------------
    // 7. VENDORS
    // -----------------------------------------------------------------------
    let vendorsCreated = 0;

    for (const v of VENDORS) {
      // Ensure service category exists
      let serviceCategory = await prisma.vendorServiceCategory.findFirst({
        where: { propertyId, name: v.category },
      });
      if (!serviceCategory) {
        serviceCategory = await prisma.vendorServiceCategory.create({
          data: { propertyId, name: v.category, isActive: true },
        });
      }

      const existing = await prisma.vendor.findFirst({
        where: { propertyId, companyName: v.company },
      });

      if (!existing) {
        await prisma.vendor.create({
          data: {
            propertyId,
            companyName: v.company,
            serviceCategoryId: serviceCategory.id,
            contactName: v.contactName,
            phone: v.phone,
            email: v.email,
            city: 'Toronto',
            stateProvince: 'Ontario',
            complianceStatus: 'compliant',
            isActive: true,
            createdById,
          },
        });
        vendorsCreated++;
      }
    }

    // -----------------------------------------------------------------------
    // Response
    // -----------------------------------------------------------------------
    return NextResponse.json(
      {
        data: {
          residents: residentsCreated,
          packages: packagesCreated,
          maintenanceRequests: maintenanceCreated,
          announcements: announcementsCreated,
          securityEvents: securityEventsCreated,
          keys: keysCreated,
          vendors: vendorsCreated,
        },
        message: 'Demo data seeded successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/system/seed-demo error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: String(error) }, { status: 500 });
  }
}
