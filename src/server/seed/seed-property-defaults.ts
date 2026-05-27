/**
 * Seed defaults for a freshly-created property — UX-284.
 *
 * Today's bugs that this prevents:
 * - UX-262: first resident maintenance request 500'd because the
 *   property had zero MaintenanceCategory rows.
 * - UX-266: first lost-key 500'd because the property had no
 *   IncidentType matching the hardcoded UUID.
 *
 * The previous fixes self-heal on first-use (the route creates the
 * missing row inline). This module runs at property-create time so the
 * defaults are always present from the start — first-use code paths
 * never have to fall through to the auto-create branch, and the admin
 * never sees mysterious behaviour like "my categories aren't there yet."
 *
 * Defaults are intentionally conservative — exactly the categories a
 * condo property manager would expect on day one. Admin can add,
 * rename, or disable later.
 *
 * All work runs inside a single transaction. Failures roll back so a
 * partial seed never leaves a property half-configured.
 */

import type { PrismaClient } from '@prisma/client';

/** Maintenance categories — match the slugs the resident dialog sends. */
const DEFAULT_MAINTENANCE_CATEGORIES = [
  { name: 'Plumbing', sortOrder: 10 },
  { name: 'Electrical', sortOrder: 20 },
  { name: 'HVAC / Heating / Cooling', sortOrder: 30 },
  { name: 'Appliance', sortOrder: 40 },
  { name: 'General / Other', sortOrder: 50 },
] as const;

/**
 * Incident types — covers the staff incident-report wizard's options
 * plus the auto-create cases (lost_key, etc) so the keys → lost flow
 * doesn't need its own inline seed.
 */
const DEFAULT_INCIDENT_TYPES = [
  { name: 'Lost Key', slug: 'lost_key', defaultPriority: 'high' },
  { name: 'Suspicious Activity', slug: 'suspicious_activity', defaultPriority: 'high' },
  { name: 'Theft', slug: 'theft', defaultPriority: 'urgent' },
  { name: 'Vandalism', slug: 'vandalism', defaultPriority: 'high' },
  { name: 'Water / Flood', slug: 'water_flood', defaultPriority: 'urgent' },
  { name: 'Medical Emergency', slug: 'medical_emergency', defaultPriority: 'urgent' },
  { name: 'Fire Alarm', slug: 'fire_alarm', defaultPriority: 'urgent' },
  { name: 'Noise Complaint', slug: 'noise_complaint', defaultPriority: 'normal' },
  { name: 'Parking Issue', slug: 'parking_issue', defaultPriority: 'normal' },
  { name: 'Other', slug: 'other', defaultPriority: 'normal' },
] as const;

type TxClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Idempotent: safe to call on an existing property. Uses createMany with
 * skipDuplicates where the underlying schema allows; otherwise checks for
 * existing rows first. Returns counts so callers can log what landed.
 */
export async function seedPropertyDefaults(
  tx: TxClient,
  propertyId: string,
): Promise<{ maintenanceCategoriesCreated: number; incidentTypesCreated: number }> {
  // ---- Maintenance categories ---------------------------------------
  const existingMaintCount = await tx.maintenanceCategory.count({ where: { propertyId } });
  let maintenanceCategoriesCreated = 0;
  if (existingMaintCount === 0) {
    const created = await tx.maintenanceCategory.createMany({
      data: DEFAULT_MAINTENANCE_CATEGORIES.map((c) => ({
        propertyId,
        name: c.name,
        sortOrder: c.sortOrder,
        isActive: true,
      })),
    });
    maintenanceCategoriesCreated = created.count;
  }

  // ---- Incident types -----------------------------------------------
  const existingIncidentCount = await tx.incidentType.count({ where: { propertyId } });
  let incidentTypesCreated = 0;
  if (existingIncidentCount === 0) {
    // IncidentType has a composite unique constraint on (propertyId, slug)
    // in some schemas — use individual creates to surface conflicts
    // clearly rather than silently swallowing.
    for (const type of DEFAULT_INCIDENT_TYPES) {
      try {
        await tx.incidentType.create({
          data: {
            propertyId,
            name: type.name,
            slug: type.slug,
            defaultPriority: type.defaultPriority,
          },
        });
        incidentTypesCreated++;
      } catch (err) {
        // P2002 = unique violation; treat as already-seeded and continue.
        const code = (err as { code?: string } | null)?.code;
        if (code !== 'P2002') throw err;
      }
    }
  }

  return { maintenanceCategoriesCreated, incidentTypesCreated };
}
