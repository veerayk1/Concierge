/**
 * Resident-facing API calls.
 *
 * These wrap the existing /api/v1/resident/* endpoints. Auth is
 * applied by the apiCall wrapper — every endpoint here requires a
 * resident JWT.
 */

import { apiCall } from './client';

export interface Package {
  id: string;
  referenceNumber: string;
  status: 'unreleased' | 'released' | 'discarded';
  description: string | null;
  isPerishable: boolean;
  isOversized: boolean;
  createdAt: string;
  releasedAt: string | null;
  courier: { name: string; iconUrl?: string | null } | null;
  unit: { number: string } | null;
}

export interface MaintenanceRequest {
  id: string;
  referenceNumber: string;
  description: string;
  status: 'open' | 'in_progress' | 'on_hold' | 'closed' | 'resolved';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  categoryName?: string;
  createdAt: string;
  updatedAt: string;
  unitNumber?: string;
}

export interface Booking {
  id: string;
  referenceNumber: string;
  amenityId: string;
  amenityName?: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  status: 'pending' | 'approved' | 'declined' | 'cancelled' | 'completed';
  approvalStatus: 'pending' | 'approved' | 'declined';
  guestCount: number;
  requestorComments: string | null;
}

interface Paginated<T> {
  data: T[];
  meta?: { page: number; pageSize: number; total: number };
}

export async function listMyPackages(status?: 'unreleased' | 'released'): Promise<Package[]> {
  const query = status ? `?status=${status}` : '';
  const res = await apiCall<Paginated<Package> | Package[]>(`/api/v1/resident/packages${query}`);
  return Array.isArray(res) ? res : res.data;
}

export async function listMyRequests(): Promise<MaintenanceRequest[]> {
  const res = await apiCall<Paginated<MaintenanceRequest> | MaintenanceRequest[]>(
    '/api/v1/resident/maintenance',
  );
  return Array.isArray(res) ? res : res.data;
}

export async function listMyBookings(): Promise<Booking[]> {
  const res = await apiCall<Paginated<Booking> | Booking[]>('/api/v1/resident/bookings');
  return Array.isArray(res) ? res : res.data;
}

export async function createMaintenanceRequest(input: {
  description: string;
  categoryKey?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  permissionToEnter?: boolean;
}): Promise<MaintenanceRequest> {
  // POST responses are enveloped as { data: <created>, message }.
  const res = await apiCall<{ data: MaintenanceRequest } | MaintenanceRequest>(
    '/api/v1/resident/maintenance',
    { method: 'POST', body: input },
  );
  return 'data' in res ? res.data : res;
}

export async function createBooking(input: {
  amenityId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  guestCount: number;
  requestorComments?: string;
}): Promise<Booking> {
  const res = await apiCall<{ data: Booking } | Booking>('/api/v1/resident/bookings', {
    method: 'POST',
    body: input,
  });
  return 'data' in res ? res.data : res;
}

// ---------------------------------------------------------------------------
// Visitor pre-authorization
// ---------------------------------------------------------------------------

export interface Visitor {
  id: string;
  visitorName: string;
  visitorType: 'visitor' | 'delivery_person' | 'contractor' | 'real_estate_agent' | 'other';
  arrivalAt: string;
  comments: string | null;
}

export async function listMyExpectedVisitors(): Promise<Visitor[]> {
  const res = await apiCall<{ data: Visitor[] } | Visitor[]>('/api/v1/my/visitors?status=expected');
  return Array.isArray(res) ? res : res.data;
}

export async function preAuthorizeVisitor(input: {
  visitorName: string;
  visitorType?: Visitor['visitorType'];
  expectedArrivalAt: string;
  notes?: string;
}): Promise<Visitor> {
  const res = await apiCall<{ data: Visitor } | Visitor>('/api/v1/my/visitors', {
    method: 'POST',
    body: input,
  });
  return 'data' in res ? res.data : res;
}
