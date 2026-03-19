/**
 * Resident ID Cards & Passports API Tests
 *
 * Resident cards are a building's first line of physical identification.
 * When security sees a resident, the card + QR code must instantly confirm
 * identity, unit, access level, and whether the card is still valid.
 * The digital passport extends this to a comprehensive profile lookup.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();
const mockCreateMany = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    residentCard: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      createMany: (...args: unknown[]) => mockCreateMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'admin-001',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s.replace(/<[^>]*>/g, ''),
  stripControlChars: (s: string) => s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''),
}));

import { GET, POST } from '../route';
import { GET as GET_BY_ID, PATCH } from '../[id]/route';
import { POST as VERIFY } from '../[id]/verify/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
});

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const RESIDENT_ID = '00000000-0000-4000-c000-000000000001';
const UNIT_ID = '00000000-0000-4000-e000-000000000001';
const CARD_ID = '00000000-0000-4000-f000-000000000001';

// ---------------------------------------------------------------------------
// 1. Generate resident card with photo, name, unit, access level
// ---------------------------------------------------------------------------

describe('POST /api/v1/resident-cards — Generate Card', () => {
  const validBody = {
    propertyId: PROPERTY_ID,
    residentId: RESIDENT_ID,
    unitId: UNIT_ID,
    residentName: 'Priya Sharma',
    photoUrl: 'https://cdn.example.com/photos/priya.jpg',
    accessLevel: 'full',
  };

  it('generates a card with photo, name, unit, and access level', async () => {
    const now = new Date();
    mockCreate.mockResolvedValue({
      id: CARD_ID,
      ...validBody,
      status: 'active',
      qrCode: 'qr-token-abc123',
      expiresAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
      createdAt: now,
    });

    const req = createPostRequest('/api/v1/resident-cards', validBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);
    expect(body.data).toMatchObject({
      residentName: 'Priya Sharma',
      photoUrl: 'https://cdn.example.com/photos/priya.jpg',
      unitId: UNIT_ID,
      accessLevel: 'full',
      status: 'active',
    });
  });

  it('rejects missing residentName', async () => {
    const req = createPostRequest('/api/v1/resident-cards', {
      ...validBody,
      residentName: '',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing propertyId', async () => {
    const req = createPostRequest('/api/v1/resident-cards', {
      ...validBody,
      propertyId: '',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid accessLevel', async () => {
    const req = createPostRequest('/api/v1/resident-cards', {
      ...validBody,
      accessLevel: 'superuser',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 2. Card contains QR code for digital verification
// ---------------------------------------------------------------------------

describe('POST /api/v1/resident-cards — QR Code Generation', () => {
  it('generates a QR verification token on card creation', async () => {
    mockCreate.mockResolvedValue({
      id: CARD_ID,
      propertyId: PROPERTY_ID,
      residentId: RESIDENT_ID,
      residentName: 'Priya Sharma',
      qrCode: 'qr-token-abc123',
      status: 'active',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 86400000),
    });

    const req = createPostRequest('/api/v1/resident-cards', {
      propertyId: PROPERTY_ID,
      residentId: RESIDENT_ID,
      unitId: UNIT_ID,
      residentName: 'Priya Sharma',
      accessLevel: 'full',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { qrCode: string } }>(res);
    expect(body.data.qrCode).toBeTruthy();
    expect(typeof body.data.qrCode).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// 3. Card expiry date (annual renewal)
// ---------------------------------------------------------------------------

describe('POST /api/v1/resident-cards — Annual Expiry', () => {
  it('sets expiry date to one year from creation', async () => {
    const now = new Date();
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    mockCreate.mockResolvedValue({
      id: CARD_ID,
      propertyId: PROPERTY_ID,
      residentId: RESIDENT_ID,
      residentName: 'Priya Sharma',
      status: 'active',
      qrCode: 'qr-token-abc123',
      expiresAt: oneYearFromNow,
      createdAt: now,
    });

    const req = createPostRequest('/api/v1/resident-cards', {
      propertyId: PROPERTY_ID,
      residentId: RESIDENT_ID,
      unitId: UNIT_ID,
      residentName: 'Priya Sharma',
      accessLevel: 'full',
    });
    const res = await POST(req);
    const body = await parseResponse<{ data: { expiresAt: string } }>(res);

    const expiresAt = new Date(body.data.expiresAt);
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / 86400000);

    // Should be approximately 365 days (allow for leap year)
    expect(diffDays).toBeGreaterThanOrEqual(365);
    expect(diffDays).toBeLessThanOrEqual(366);
  });
});

// ---------------------------------------------------------------------------
// 4. Card status: active, expired, revoked, lost
// ---------------------------------------------------------------------------

describe('GET /api/v1/resident-cards — Status Filtering', () => {
  it('filters cards by active status', async () => {
    const req = createGetRequest('/api/v1/resident-cards', {
      searchParams: { propertyId: PROPERTY_ID, status: 'active' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('active');
  });

  it('filters cards by expired status', async () => {
    const req = createGetRequest('/api/v1/resident-cards', {
      searchParams: { propertyId: PROPERTY_ID, status: 'expired' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('expired');
  });

  it('filters cards by revoked status', async () => {
    const req = createGetRequest('/api/v1/resident-cards', {
      searchParams: { propertyId: PROPERTY_ID, status: 'revoked' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('revoked');
  });

  it('filters cards by lost status', async () => {
    const req = createGetRequest('/api/v1/resident-cards', {
      searchParams: { propertyId: PROPERTY_ID, status: 'lost' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('lost');
  });

  it('defaults to all statuses when none specified', async () => {
    const req = createGetRequest('/api/v1/resident-cards', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.status).toBeUndefined();
  });

  it('rejects invalid status value', async () => {
    const req = createGetRequest('/api/v1/resident-cards', {
      searchParams: { propertyId: PROPERTY_ID, status: 'invalid' },
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing propertyId', async () => {
    const req = createGetRequest('/api/v1/resident-cards');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 5. Revoke card on move-out
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/resident-cards/:id — Revoke on Move-Out', () => {
  it('revokes an active card with reason "move_out"', async () => {
    mockFindUnique.mockResolvedValue({
      id: CARD_ID,
      status: 'active',
      residentName: 'Priya Sharma',
    });
    mockUpdate.mockResolvedValue({
      id: CARD_ID,
      status: 'revoked',
      revokedReason: 'move_out',
      revokedAt: new Date(),
    });

    const req = createPatchRequest(`/api/v1/resident-cards/${CARD_ID}`, {
      status: 'revoked',
      revokedReason: 'move_out',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: CARD_ID }) });

    expect(res.status).toBe(200);
    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.status).toBe('revoked');
    expect(updateData.revokedReason).toBe('move_out');
    expect(updateData.revokedAt).toBeInstanceOf(Date);
  });

  it('returns 404 for non-existent card', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/resident-cards/nonexistent', {
      status: 'revoked',
      revokedReason: 'move_out',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(res.status).toBe(404);
  });

  it('rejects revoking an already revoked card', async () => {
    mockFindUnique.mockResolvedValue({
      id: CARD_ID,
      status: 'revoked',
      residentName: 'Priya Sharma',
    });

    const req = createPatchRequest(`/api/v1/resident-cards/${CARD_ID}`, {
      status: 'revoked',
      revokedReason: 'move_out',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: CARD_ID }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_REVOKED');
  });
});

// ---------------------------------------------------------------------------
// 6. Replace lost card (deactivate old, generate new)
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/resident-cards/:id — Replace Lost Card', () => {
  it('marks card as lost and generates a replacement via transaction', async () => {
    const oldCard = {
      id: CARD_ID,
      status: 'active',
      residentId: RESIDENT_ID,
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      residentName: 'Priya Sharma',
      accessLevel: 'full',
      photoUrl: 'https://cdn.example.com/photos/priya.jpg',
      designTemplate: null,
    };
    mockFindUnique.mockResolvedValue(oldCard);

    const newCardId = '00000000-0000-4000-f000-000000000002';
    mockTransaction.mockResolvedValue({
      oldCard: { ...oldCard, status: 'lost', revokedAt: new Date() },
      newCard: {
        id: newCardId,
        status: 'active',
        residentId: RESIDENT_ID,
        residentName: 'Priya Sharma',
        replacesCardId: CARD_ID,
        qrCode: 'qr-new-token',
        createdAt: new Date(),
      },
    });

    const req = createPatchRequest(`/api/v1/resident-cards/${CARD_ID}`, {
      status: 'lost',
      replaceLost: true,
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: CARD_ID }) });

    expect(res.status).toBe(200);
    expect(mockTransaction).toHaveBeenCalled();
    const body = await parseResponse<{
      data: { oldCard: { status: string }; newCard: { replacesCardId: string } };
    }>(res);
    expect(body.data.oldCard.status).toBe('lost');
    expect(body.data.newCard.replacesCardId).toBe(CARD_ID);
  });
});

// ---------------------------------------------------------------------------
// 7. Digital passport: comprehensive resident profile
// ---------------------------------------------------------------------------

describe('GET /api/v1/resident-cards/:id — Digital Passport', () => {
  it('returns comprehensive resident profile when passport=true', async () => {
    mockFindUnique.mockResolvedValue({
      id: CARD_ID,
      residentId: RESIDENT_ID,
      residentName: 'Priya Sharma',
      status: 'active',
      accessLevel: 'full',
      unitId: UNIT_ID,
      propertyId: PROPERTY_ID,
      qrCode: 'qr-token-abc123',
      expiresAt: new Date(Date.now() + 365 * 86400000),
      createdAt: new Date('2025-06-15'),
      emergencyContacts: [{ name: 'Raj Sharma', phone: '+14165551234', relation: 'spouse' }],
      vehicles: [{ make: 'Toyota', model: 'Camry', plate: 'ABCD 123', color: 'Silver' }],
      pets: [{ name: 'Buddy', type: 'dog', breed: 'Golden Retriever' }],
      moveInDate: new Date('2024-01-15'),
    });

    const req = createGetRequest(`/api/v1/resident-cards/${CARD_ID}`, {
      searchParams: { passport: 'true' },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: CARD_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);
    expect(body.data.residentName).toBe('Priya Sharma');
    expect(body.data.emergencyContacts).toBeDefined();
    expect(body.data.vehicles).toBeDefined();
    expect(body.data.pets).toBeDefined();
    expect(body.data.moveInDate).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 8. Passport includes: emergency contacts, vehicle info, pet info, move-in date
// ---------------------------------------------------------------------------

describe('GET /api/v1/resident-cards/:id — Passport Data Fields', () => {
  it('includes emergency contacts array', async () => {
    const contacts = [
      { name: 'Raj Sharma', phone: '+14165551234', relation: 'spouse' },
      { name: 'Anita Patel', phone: '+14165555678', relation: 'parent' },
    ];
    mockFindUnique.mockResolvedValue({
      id: CARD_ID,
      residentName: 'Priya Sharma',
      status: 'active',
      emergencyContacts: contacts,
      vehicles: [],
      pets: [],
      moveInDate: new Date('2024-01-15'),
    });

    const req = createGetRequest(`/api/v1/resident-cards/${CARD_ID}`, {
      searchParams: { passport: 'true' },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: CARD_ID }) });
    const body = await parseResponse<{ data: { emergencyContacts: unknown[] } }>(res);

    expect(body.data.emergencyContacts).toHaveLength(2);
  });

  it('includes vehicle info', async () => {
    mockFindUnique.mockResolvedValue({
      id: CARD_ID,
      residentName: 'Priya Sharma',
      status: 'active',
      emergencyContacts: [],
      vehicles: [{ make: 'Honda', model: 'Civic', plate: 'XYZ 789', color: 'Blue' }],
      pets: [],
      moveInDate: new Date('2024-01-15'),
    });

    const req = createGetRequest(`/api/v1/resident-cards/${CARD_ID}`, {
      searchParams: { passport: 'true' },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: CARD_ID }) });
    const body = await parseResponse<{ data: { vehicles: unknown[] } }>(res);

    expect(body.data.vehicles).toHaveLength(1);
  });

  it('includes pet info', async () => {
    mockFindUnique.mockResolvedValue({
      id: CARD_ID,
      residentName: 'Priya Sharma',
      status: 'active',
      emergencyContacts: [],
      vehicles: [],
      pets: [{ name: 'Buddy', type: 'dog', breed: 'Golden Retriever' }],
      moveInDate: new Date('2024-01-15'),
    });

    const req = createGetRequest(`/api/v1/resident-cards/${CARD_ID}`, {
      searchParams: { passport: 'true' },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: CARD_ID }) });
    const body = await parseResponse<{ data: { pets: unknown[] } }>(res);

    expect(body.data.pets).toHaveLength(1);
  });

  it('includes move-in date', async () => {
    mockFindUnique.mockResolvedValue({
      id: CARD_ID,
      residentName: 'Priya Sharma',
      status: 'active',
      emergencyContacts: [],
      vehicles: [],
      pets: [],
      moveInDate: new Date('2024-01-15'),
    });

    const req = createGetRequest(`/api/v1/resident-cards/${CARD_ID}`, {
      searchParams: { passport: 'true' },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: CARD_ID }) });
    const body = await parseResponse<{ data: { moveInDate: string } }>(res);

    expect(body.data.moveInDate).toBeTruthy();
  });

  it('returns 404 for non-existent card', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/resident-cards/nonexistent', {
      searchParams: { passport: 'true' },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 9. Passport QR scan by security for quick lookup
// ---------------------------------------------------------------------------

describe('POST /api/v1/resident-cards/:id/verify — QR Verification', () => {
  it('verifies a valid QR code and returns resident info', async () => {
    mockFindUnique.mockResolvedValue({
      id: CARD_ID,
      residentName: 'Priya Sharma',
      status: 'active',
      accessLevel: 'full',
      qrCode: 'qr-token-abc123',
      unitId: UNIT_ID,
      propertyId: PROPERTY_ID,
      expiresAt: new Date(Date.now() + 365 * 86400000),
      photoUrl: 'https://cdn.example.com/photos/priya.jpg',
    });

    const req = createPostRequest(`/api/v1/resident-cards/${CARD_ID}/verify`, {
      qrCode: 'qr-token-abc123',
    });
    const res = await VERIFY(req, { params: Promise.resolve({ id: CARD_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { verified: boolean; residentName: string } }>(res);
    expect(body.data.verified).toBe(true);
    expect(body.data.residentName).toBe('Priya Sharma');
  });

  it('rejects invalid QR code', async () => {
    mockFindUnique.mockResolvedValue({
      id: CARD_ID,
      qrCode: 'qr-token-abc123',
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 86400000),
    });

    const req = createPostRequest(`/api/v1/resident-cards/${CARD_ID}/verify`, {
      qrCode: 'wrong-token',
    });
    const res = await VERIFY(req, { params: Promise.resolve({ id: CARD_ID }) });

    expect(res.status).toBe(401);
    const body = await parseResponse<{ data: { verified: boolean } }>(res);
    expect(body.data.verified).toBe(false);
  });

  it('rejects verification for expired card', async () => {
    mockFindUnique.mockResolvedValue({
      id: CARD_ID,
      qrCode: 'qr-token-abc123',
      status: 'expired',
      expiresAt: new Date(Date.now() - 86400000),
    });

    const req = createPostRequest(`/api/v1/resident-cards/${CARD_ID}/verify`, {
      qrCode: 'qr-token-abc123',
    });
    const res = await VERIFY(req, { params: Promise.resolve({ id: CARD_ID }) });

    expect(res.status).toBe(401);
    const body = await parseResponse<{ data: { verified: boolean; reason: string } }>(res);
    expect(body.data.verified).toBe(false);
    expect(body.data.reason).toBe('CARD_NOT_ACTIVE');
  });

  it('rejects verification for revoked card', async () => {
    mockFindUnique.mockResolvedValue({
      id: CARD_ID,
      qrCode: 'qr-token-abc123',
      status: 'revoked',
      expiresAt: new Date(Date.now() + 365 * 86400000),
    });

    const req = createPostRequest(`/api/v1/resident-cards/${CARD_ID}/verify`, {
      qrCode: 'qr-token-abc123',
    });
    const res = await VERIFY(req, { params: Promise.resolve({ id: CARD_ID }) });

    expect(res.status).toBe(401);
    const body = await parseResponse<{ data: { verified: boolean; reason: string } }>(res);
    expect(body.data.verified).toBe(false);
    expect(body.data.reason).toBe('CARD_NOT_ACTIVE');
  });

  it('returns 404 for non-existent card', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/resident-cards/nonexistent/verify', {
      qrCode: 'any-token',
    });
    const res = await VERIFY(req, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 10. Bulk card generation for new building onboarding
// ---------------------------------------------------------------------------

describe('POST /api/v1/resident-cards — Bulk Generation', () => {
  it('generates multiple cards in a single request', async () => {
    const residents = [
      {
        residentId: 'r-1',
        unitId: 'u-1',
        residentName: 'Alice Wong',
        accessLevel: 'full' as const,
      },
      {
        residentId: 'r-2',
        unitId: 'u-2',
        residentName: 'Bob Chen',
        accessLevel: 'limited' as const,
      },
      {
        residentId: 'r-3',
        unitId: 'u-3',
        residentName: 'Carol Davis',
        accessLevel: 'full' as const,
      },
    ];

    mockCreateMany.mockResolvedValue({
      count: 3,
      cards: residents.map((r, i) => ({
        id: `card-${i + 1}`,
        ...r,
        propertyId: PROPERTY_ID,
        status: 'active',
        qrCode: `qr-bulk-${i + 1}`,
        expiresAt: new Date(Date.now() + 365 * 86400000),
        createdAt: new Date(),
      })),
    });

    const req = createPostRequest('/api/v1/resident-cards', {
      propertyId: PROPERTY_ID,
      bulk: true,
      residents,
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { count: number } }>(res);
    expect(body.data.count).toBe(3);
  });

  it('rejects bulk request with empty residents array', async () => {
    const req = createPostRequest('/api/v1/resident-cards', {
      propertyId: PROPERTY_ID,
      bulk: true,
      residents: [],
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejects bulk request with more than 500 residents', async () => {
    const residents = Array.from({ length: 501 }, (_, i) => ({
      residentId: `r-${i}`,
      unitId: `u-${i}`,
      residentName: `Resident ${i}`,
      accessLevel: 'full',
    }));

    const req = createPostRequest('/api/v1/resident-cards', {
      propertyId: PROPERTY_ID,
      bulk: true,
      residents,
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 11. Card design templates per property (white-label)
// ---------------------------------------------------------------------------

describe('POST /api/v1/resident-cards — Design Templates', () => {
  it('applies a property-specific design template', async () => {
    mockCreate.mockResolvedValue({
      id: CARD_ID,
      propertyId: PROPERTY_ID,
      residentId: RESIDENT_ID,
      residentName: 'Priya Sharma',
      designTemplate: 'luxury-gold',
      status: 'active',
      qrCode: 'qr-token-abc123',
      expiresAt: new Date(Date.now() + 365 * 86400000),
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/resident-cards', {
      propertyId: PROPERTY_ID,
      residentId: RESIDENT_ID,
      unitId: UNIT_ID,
      residentName: 'Priya Sharma',
      accessLevel: 'full',
      designTemplate: 'luxury-gold',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { designTemplate: string } }>(res);
    expect(body.data.designTemplate).toBe('luxury-gold');
  });

  it('defaults to "standard" template when none specified', async () => {
    mockCreate.mockResolvedValue({
      id: CARD_ID,
      propertyId: PROPERTY_ID,
      residentId: RESIDENT_ID,
      residentName: 'Priya Sharma',
      designTemplate: 'standard',
      status: 'active',
      qrCode: 'qr-token-abc123',
      expiresAt: new Date(Date.now() + 365 * 86400000),
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/resident-cards', {
      propertyId: PROPERTY_ID,
      residentId: RESIDENT_ID,
      unitId: UNIT_ID,
      residentName: 'Priya Sharma',
      accessLevel: 'full',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.designTemplate).toBe('standard');
  });
});
