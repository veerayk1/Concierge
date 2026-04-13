/**
 * Resident Onboarding API — Track and save onboarding wizard progress
 *
 * GET  /api/v1/resident/onboarding — Returns onboarding status + step completion
 * POST /api/v1/resident/onboarding — Save data for a specific step
 *
 * Accessible to resident roles only (owner, tenant, family member, offsite owner).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import type { Role } from '@/types';

const RESIDENT_ROLES: Role[] = [
  'resident_owner',
  'resident_tenant',
  'family_member',
  'offsite_owner',
];

// ---------------------------------------------------------------------------
// GET — Onboarding status
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: RESIDENT_ROLES });
    if (auth.error) return auth.error;

    const { userId, propertyId, unitId, role } = auth.user;

    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        phone: true,
        activatedAt: true,
        languagePreference: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'User not found' }, { status: 404 });
    }

    // Check emergency contacts
    let emergencyContactCount = 0;
    if (unitId) {
      try {
        emergencyContactCount = await prisma.emergencyContact.count({
          where: { userId, unitId },
        });
      } catch {
        // Table may not exist — treat as 0
      }
    }

    // Check vehicles
    let vehicleCount = 0;
    if (unitId) {
      try {
        vehicleCount = await prisma.vehicle.count({
          where: { userId, unitId },
        });
      } catch {
        // Table may not exist
      }
    }

    // Check pets
    let petCount = 0;
    if (unitId) {
      try {
        petCount = await prisma.pet.count({
          where: { userId, unitId },
        });
      } catch {
        // Table may not exist
      }
    }

    // Resolve unit number and property name
    let unitNumber = '';
    let propertyName = '';
    try {
      if (unitId) {
        const unit = await prisma.unit.findUnique({
          where: { id: unitId },
          select: { number: true },
        });
        unitNumber = unit?.number ?? '';
      }
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { name: true },
      });
      propertyName = property?.name ?? '';
    } catch {
      // Continue with defaults
    }

    // Determine step completion
    const hasProfile = Boolean(user.phone);
    const hasEmergencyContacts = emergencyContactCount > 0;
    const isActivated = Boolean(user.activatedAt);

    // Derive resident type label from role
    const residentTypeMap: Record<string, string> = {
      resident_owner: 'Owner',
      resident_tenant: 'Tenant',
      family_member: 'Family Member',
      offsite_owner: 'Off-Site Owner',
    };

    const steps = {
      welcome: true, // Always considered complete once they land on the page
      profile: hasProfile,
      emergencyContacts: hasEmergencyContacts,
      vehicles: vehicleCount > 0,
      pets: petCount > 0,
      complete: isActivated,
    };

    const completed = isActivated;

    return NextResponse.json({
      data: {
        completed,
        steps,
        counts: {
          emergencyContacts: emergencyContactCount,
          vehicles: vehicleCount,
          pets: petCount,
        },
        residentType: residentTypeMap[role] ?? 'Resident',
        unitNumber,
        propertyName,
        firstName: user.firstName,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/resident/onboarding error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to load onboarding status' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Save step data
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: RESIDENT_ROLES });
    if (auth.error) return auth.error;

    const { userId, propertyId, unitId } = auth.user;

    const body = await request.json();
    const { step, data } = body;

    if (!step || typeof step !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'step is required' },
        { status: 400 },
      );
    }

    switch (step) {
      // -------------------------------------------------------------------
      // Profile — update phone, language preference
      // -------------------------------------------------------------------
      case 'profile': {
        const updateData: Record<string, unknown> = {};
        if (data.phone) updateData.phone = String(data.phone).slice(0, 20);
        if (data.language) updateData.languagePreference = String(data.language).slice(0, 5);
        if (typeof data.accessibilityNeeds === 'boolean') {
          updateData.assistanceRequired = data.accessibilityNeeds;
        }
        if (data.accessibilityNotes) {
          updateData.assistanceNotes = String(data.accessibilityNotes).slice(0, 500);
        }

        await prisma.user.update({
          where: { id: userId },
          data: updateData,
        });

        return NextResponse.json({ data: { saved: true, step: 'profile' } });
      }

      // -------------------------------------------------------------------
      // Emergency Contacts — create records
      // -------------------------------------------------------------------
      case 'emergencyContacts': {
        if (!Array.isArray(data.contacts) || data.contacts.length === 0) {
          return NextResponse.json(
            { error: 'VALIDATION_ERROR', message: 'At least one emergency contact is required' },
            { status: 400 },
          );
        }

        if (!unitId) {
          return NextResponse.json(
            { error: 'VALIDATION_ERROR', message: 'No unit assigned to this user' },
            { status: 400 },
          );
        }

        // Create each contact
        const created = [];
        for (let i = 0; i < Math.min(data.contacts.length, 3); i++) {
          const c = data.contacts[i];
          if (!c.name || !c.phone) continue;

          const contact = await prisma.emergencyContact.create({
            data: {
              propertyId,
              unitId,
              userId,
              contactName: String(c.name).slice(0, 100),
              relationship: String(c.relationship || 'Other').slice(0, 50),
              phonePrimary: String(c.phone).slice(0, 20),
              email: c.email ? String(c.email).slice(0, 254) : null,
              sortOrder: i,
            },
          });
          created.push(contact.id);
        }

        return NextResponse.json({
          data: { saved: true, step: 'emergencyContacts', count: created.length },
        });
      }

      // -------------------------------------------------------------------
      // Vehicles — create vehicle records
      // -------------------------------------------------------------------
      case 'vehicles': {
        if (data.skipped) {
          return NextResponse.json({ data: { saved: true, step: 'vehicles', skipped: true } });
        }

        if (!Array.isArray(data.vehicles) || data.vehicles.length === 0) {
          return NextResponse.json({ data: { saved: true, step: 'vehicles', skipped: true } });
        }

        if (!unitId) {
          return NextResponse.json(
            { error: 'VALIDATION_ERROR', message: 'No unit assigned to this user' },
            { status: 400 },
          );
        }

        const createdVehicles = [];
        for (const v of data.vehicles) {
          if (!v.make || !v.model || !v.licensePlate) continue;

          const vehicle = await prisma.vehicle.create({
            data: {
              propertyId,
              unitId,
              userId,
              make: String(v.make).slice(0, 50),
              model: String(v.model).slice(0, 50),
              color: v.color ? String(v.color).slice(0, 30) : null,
              licensePlate: String(v.licensePlate).slice(0, 20),
              provinceState: String(v.province || 'ON').slice(0, 50),
            },
          });
          createdVehicles.push(vehicle.id);
        }

        return NextResponse.json({
          data: { saved: true, step: 'vehicles', count: createdVehicles.length },
        });
      }

      // -------------------------------------------------------------------
      // Pets — create pet records
      // -------------------------------------------------------------------
      case 'pets': {
        if (data.skipped) {
          return NextResponse.json({ data: { saved: true, step: 'pets', skipped: true } });
        }

        if (!Array.isArray(data.pets) || data.pets.length === 0) {
          return NextResponse.json({ data: { saved: true, step: 'pets', skipped: true } });
        }

        if (!unitId) {
          return NextResponse.json(
            { error: 'VALIDATION_ERROR', message: 'No unit assigned to this user' },
            { status: 400 },
          );
        }

        const createdPets = [];
        for (const p of data.pets) {
          if (!p.name || !p.species) continue;

          const pet = await prisma.pet.create({
            data: {
              propertyId,
              unitId,
              userId,
              name: String(p.name).slice(0, 100),
              species: String(p.species).slice(0, 50),
              breed: p.breed ? String(p.breed).slice(0, 100) : null,
              weight: p.weight ? parseFloat(p.weight) || null : null,
            },
          });
          createdPets.push(pet.id);
        }

        return NextResponse.json({
          data: { saved: true, step: 'pets', count: createdPets.length },
        });
      }

      // -------------------------------------------------------------------
      // Complete — mark onboarding as finished
      // -------------------------------------------------------------------
      case 'complete': {
        await prisma.user.update({
          where: { id: userId },
          data: { activatedAt: new Date() },
        });

        return NextResponse.json({ data: { saved: true, step: 'complete' } });
      }

      default:
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: `Unknown step: ${step}` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('POST /api/v1/resident/onboarding error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to save onboarding data' },
      { status: 500 },
    );
  }
}
