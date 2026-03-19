/**
 * Building Directory API Route Tests
 *
 * The building directory centralizes staff, vendors, and emergency contacts
 * for a property. Aquarius prominently features emergency contacts (2 clicks
 * to find next-of-kin), and BuildingLink's vendor directory adds compliance.
 * These tests ensure the directory is searchable, role-aware, and complete.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockDirectoryEntryFindMany = vi.fn();
const mockDirectoryEntryFindUnique = vi.fn();
const mockDirectoryEntryCount = vi.fn();
const mockDirectoryEntryCreate = vi.fn();
const mockPropertyEmergencyContactFindMany = vi.fn();
const mockPropertyEmergencyContactCreate = vi.fn();
const mockPropertyEmergencyContactCount = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    directoryEntry: {
      findMany: (...args: unknown[]) => mockDirectoryEntryFindMany(...args),
      findUnique: (...args: unknown[]) => mockDirectoryEntryFindUnique(...args),
      count: (...args: unknown[]) => mockDirectoryEntryCount(...args),
      create: (...args: unknown[]) => mockDirectoryEntryCreate(...args),
    },
    propertyEmergencyContact: {
      findMany: (...args: unknown[]) => mockPropertyEmergencyContactFindMany(...args),
      create: (...args: unknown[]) => mockPropertyEmergencyContactCreate(...args),
      count: (...args: unknown[]) => mockPropertyEmergencyContactCount(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-staff',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_manager',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

// Route imports MUST come after vi.mock calls
import { GET, POST } from '../route';
import { GET as GET_DETAIL } from '../../building-directory/[id]/route';
import {
  GET as GET_EMERGENCY,
  POST as POST_EMERGENCY,
} from '../../building-directory/emergency-contacts/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockDirectoryEntryFindMany.mockResolvedValue([]);
  mockDirectoryEntryCount.mockResolvedValue(0);
  mockPropertyEmergencyContactFindMany.mockResolvedValue([]);
  mockPropertyEmergencyContactCount.mockResolvedValue(0);
});

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const ENTRY_ID = '00000000-0000-4000-e000-000000000001';
const USER_ID = '00000000-0000-4000-f000-000000000001';

// ---------------------------------------------------------------------------
// 1. GET /api/v1/building-directory — List all staff with roles and contact info
// ---------------------------------------------------------------------------

describe('GET /api/v1/building-directory — List staff with roles', () => {
  it('REJECTS without propertyId', async () => {
    const req = createGetRequest('/api/v1/building-directory');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockDirectoryEntryFindMany).not.toHaveBeenCalled();
  });

  it('scopes to propertyId — tenant isolation', async () => {
    const req = createGetRequest('/api/v1/building-directory', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockDirectoryEntryFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('returns staff entries with roles and contact info', async () => {
    mockDirectoryEntryFindMany.mockResolvedValue([
      {
        id: ENTRY_ID,
        type: 'staff',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'property_manager',
        department: 'Management',
        email: 'jane@building.com',
        phone: '416-555-0100',
      },
    ]);
    mockDirectoryEntryCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/building-directory', {
      searchParams: { propertyId: PROPERTY_ID, type: 'staff' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{ firstName: string; role: string; email: string }>;
    }>(res);
    expect(body.data[0]!.firstName).toBe('Jane');
    expect(body.data[0]!.role).toBe('property_manager');
    expect(body.data[0]!.email).toBe('jane@building.com');
  });
});

// ---------------------------------------------------------------------------
// 2. List all vendors with specialties
// ---------------------------------------------------------------------------

describe('GET /api/v1/building-directory — List vendors with specialties', () => {
  it('returns vendor entries with specialties', async () => {
    mockDirectoryEntryFindMany.mockResolvedValue([
      {
        id: ENTRY_ID,
        type: 'vendor',
        firstName: 'ACME Plumbing',
        lastName: '',
        role: null,
        department: null,
        specialty: 'plumbing',
        complianceStatus: 'compliant',
        email: 'info@acme.com',
        phone: '416-555-0200',
      },
    ]);
    mockDirectoryEntryCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/building-directory', {
      searchParams: { propertyId: PROPERTY_ID, type: 'vendor' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{ type: string; specialty: string }>;
    }>(res);
    expect(body.data[0]!.type).toBe('vendor');
    expect(body.data[0]!.specialty).toBe('plumbing');
  });

  it('filters by type=vendor in the where clause', async () => {
    const req = createGetRequest('/api/v1/building-directory', {
      searchParams: { propertyId: PROPERTY_ID, type: 'vendor' },
    });
    await GET(req);

    const where = mockDirectoryEntryFindMany.mock.calls[0]![0].where;
    expect(where.type).toBe('vendor');
  });
});

// ---------------------------------------------------------------------------
// 3. Search directory by name, role, department
// ---------------------------------------------------------------------------

describe('GET /api/v1/building-directory — Search', () => {
  it('searches by name across firstName and lastName', async () => {
    const req = createGetRequest('/api/v1/building-directory', {
      searchParams: { propertyId: PROPERTY_ID, query: 'Jane' },
    });
    await GET(req);

    const where = mockDirectoryEntryFindMany.mock.calls[0]![0].where;
    expect(where.OR).toBeDefined();
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ firstName: expect.objectContaining({ contains: 'Jane' }) }),
        expect.objectContaining({ lastName: expect.objectContaining({ contains: 'Jane' }) }),
      ]),
    );
  });

  it('filters by role', async () => {
    const req = createGetRequest('/api/v1/building-directory', {
      searchParams: { propertyId: PROPERTY_ID, role: 'security' },
    });
    await GET(req);

    const where = mockDirectoryEntryFindMany.mock.calls[0]![0].where;
    expect(where.role).toBe('security');
  });

  it('filters by department', async () => {
    const req = createGetRequest('/api/v1/building-directory', {
      searchParams: { propertyId: PROPERTY_ID, department: 'Maintenance' },
    });
    await GET(req);

    const where = mockDirectoryEntryFindMany.mock.calls[0]![0].where;
    expect(where.department).toEqual({ contains: 'Maintenance', mode: 'insensitive' });
  });
});

// ---------------------------------------------------------------------------
// 4. Staff profiles with photo, bio, schedule
// ---------------------------------------------------------------------------

describe('GET /api/v1/building-directory/:id — Staff profile detail', () => {
  it('returns staff profile with photo, bio, and schedule', async () => {
    mockDirectoryEntryFindUnique.mockResolvedValue({
      id: ENTRY_ID,
      propertyId: PROPERTY_ID,
      type: 'staff',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'property_manager',
      department: 'Management',
      email: 'jane@building.com',
      phone: '416-555-0100',
      photoUrl: 'https://s3.example.com/photos/jane.jpg',
      bio: 'Property manager with 10 years of experience.',
      scheduleNotes: 'Monday-Friday 9am-5pm',
    });

    const req = createGetRequest('/api/v1/building-directory/detail');
    const res = await GET_DETAIL(req, {
      params: Promise.resolve({ id: ENTRY_ID }),
    });

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        firstName: string;
        photoUrl: string;
        bio: string;
        scheduleNotes: string;
      };
    }>(res);

    expect(body.data.firstName).toBe('Jane');
    expect(body.data.photoUrl).toBe('https://s3.example.com/photos/jane.jpg');
    expect(body.data.bio).toBe('Property manager with 10 years of experience.');
    expect(body.data.scheduleNotes).toBe('Monday-Friday 9am-5pm');
  });

  it('returns 404 for non-existent entry', async () => {
    mockDirectoryEntryFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/building-directory/detail');
    const res = await GET_DETAIL(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 5. Vendor profiles with compliance status
// ---------------------------------------------------------------------------

describe('GET /api/v1/building-directory/:id — Vendor profile with compliance', () => {
  it('returns vendor profile with compliance status', async () => {
    mockDirectoryEntryFindUnique.mockResolvedValue({
      id: ENTRY_ID,
      propertyId: PROPERTY_ID,
      type: 'vendor',
      firstName: 'ACME Plumbing',
      lastName: '',
      specialty: 'plumbing',
      complianceStatus: 'compliant',
      email: 'info@acme.com',
      phone: '416-555-0200',
      photoUrl: null,
      bio: null,
      scheduleNotes: null,
    });

    const req = createGetRequest('/api/v1/building-directory/detail');
    const res = await GET_DETAIL(req, {
      params: Promise.resolve({ id: ENTRY_ID }),
    });

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: { type: string; complianceStatus: string; specialty: string };
    }>(res);

    expect(body.data.type).toBe('vendor');
    expect(body.data.complianceStatus).toBe('compliant');
    expect(body.data.specialty).toBe('plumbing');
  });
});

// ---------------------------------------------------------------------------
// 6. Emergency contacts: property-level (fire dept, police, utilities)
// ---------------------------------------------------------------------------

describe('GET /api/v1/building-directory/emergency-contacts', () => {
  it('REJECTS without propertyId', async () => {
    const req = createGetRequest('/api/v1/building-directory/emergency-contacts');
    const res = await GET_EMERGENCY(req);
    expect(res.status).toBe(400);
  });

  it('returns property-level emergency contacts', async () => {
    mockPropertyEmergencyContactFindMany.mockResolvedValue([
      {
        id: 'ec-1',
        propertyId: PROPERTY_ID,
        contactType: 'fire_department',
        name: 'Toronto Fire Services',
        phone: '911',
        altPhone: '416-338-9050',
        notes: 'Non-emergency line available 24/7',
      },
      {
        id: 'ec-2',
        propertyId: PROPERTY_ID,
        contactType: 'police',
        name: 'Toronto Police — 52 Division',
        phone: '911',
        altPhone: '416-808-5200',
        notes: null,
      },
      {
        id: 'ec-3',
        propertyId: PROPERTY_ID,
        contactType: 'utility_gas',
        name: 'Enbridge Gas',
        phone: '1-866-763-5427',
        altPhone: null,
        notes: 'Gas leak emergency line',
      },
    ]);

    const req = createGetRequest('/api/v1/building-directory/emergency-contacts', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_EMERGENCY(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{ contactType: string; name: string; phone: string }>;
    }>(res);

    expect(body.data).toHaveLength(3);
    expect(body.data[0]!.contactType).toBe('fire_department');
    expect(body.data[1]!.contactType).toBe('police');
    expect(body.data[2]!.contactType).toBe('utility_gas');
  });

  it('scopes to propertyId — tenant isolation', async () => {
    const req = createGetRequest('/api/v1/building-directory/emergency-contacts', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET_EMERGENCY(req);

    const where = mockPropertyEmergencyContactFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });
});

describe('POST /api/v1/building-directory/emergency-contacts', () => {
  const validContact = {
    propertyId: PROPERTY_ID,
    contactType: 'fire_department' as const,
    name: 'Toronto Fire Services',
    phone: '911',
    altPhone: '416-338-9050',
    notes: 'Non-emergency line',
  };

  it('creates an emergency contact', async () => {
    mockPropertyEmergencyContactCreate.mockResolvedValue({
      id: 'ec-new',
      ...validContact,
    });

    const req = createPostRequest('/api/v1/building-directory/emergency-contacts', validContact);
    const res = await POST_EMERGENCY(req);
    expect(res.status).toBe(201);

    const createData = mockPropertyEmergencyContactCreate.mock.calls[0]![0].data;
    expect(createData.contactType).toBe('fire_department');
    expect(createData.name).toBe('Toronto Fire Services');
    expect(createData.propertyId).toBe(PROPERTY_ID);
  });

  it('rejects missing required fields', async () => {
    const req = createPostRequest('/api/v1/building-directory/emergency-contacts', {});
    const res = await POST_EMERGENCY(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid contactType', async () => {
    const req = createPostRequest('/api/v1/building-directory/emergency-contacts', {
      ...validContact,
      contactType: 'invalid_type',
    });
    const res = await POST_EMERGENCY(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/building-directory — Create directory entry
// ---------------------------------------------------------------------------

describe('POST /api/v1/building-directory — Create staff profile', () => {
  const validStaff = {
    propertyId: PROPERTY_ID,
    userId: USER_ID,
    role: 'property_manager' as const,
    department: 'Management',
    email: 'jane@building.com',
    phone: '416-555-0100',
    bio: 'Experienced property manager.',
    photoUrl: 'https://s3.example.com/photos/jane.jpg',
    scheduleNotes: 'Mon-Fri 9am-5pm',
  };

  it('creates a staff directory entry', async () => {
    mockDirectoryEntryCreate.mockResolvedValue({
      id: ENTRY_ID,
      type: 'staff',
      firstName: 'Jane',
      lastName: 'Smith',
      ...validStaff,
    });

    const req = createPostRequest('/api/v1/building-directory', validStaff);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockDirectoryEntryCreate.mock.calls[0]![0].data;
    expect(createData.propertyId).toBe(PROPERTY_ID);
    expect(createData.role).toBe('property_manager');
    expect(createData.department).toBe('Management');
  });

  it('rejects missing required fields', async () => {
    const req = createPostRequest('/api/v1/building-directory', {});
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('handles database errors gracefully', async () => {
    mockDirectoryEntryCreate.mockRejectedValue(new Error('DB down'));

    const req = createPostRequest('/api/v1/building-directory', validStaff);
    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('DB down');
  });
});

// ---------------------------------------------------------------------------
// Tenant isolation across all directory operations
// ---------------------------------------------------------------------------

describe('Tenant isolation', () => {
  it('cannot query directory without propertyId', async () => {
    const req = createGetRequest('/api/v1/building-directory');
    const res = await GET(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('cannot query emergency contacts without propertyId', async () => {
    const req = createGetRequest('/api/v1/building-directory/emergency-contacts');
    const res = await GET_EMERGENCY(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });
});
