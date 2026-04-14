/**
 * Batch Package Intake API — per PRD 04 Section 3.1.3
 * Create multiple packages at once (holiday peak, bulk delivery)
 * Maximum 20 packages per batch
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { batchCreatePackageSchema } from '@/schemas/package';
import { nanoid } from 'nanoid';
import { guardRoute } from '@/server/middleware/api-guard';
import { sendEmail } from '@/server/email';
import { getUnitResidentEmails } from '@/server/email';
import { renderTemplate } from '@/server/email-templates';

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = batchCreatePackageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid batch input',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { propertyId, packages: packageInputs } = parsed.data;

    // Create all packages in a transaction
    const created = await prisma.$transaction(
      packageInputs.map((input) => {
        const referenceNumber = `PKG-${nanoid(6).toUpperCase()}`;
        return prisma.package.create({
          data: {
            propertyId,
            unitId: input.unitId,
            residentId: input.residentId || null,
            direction: input.direction,
            referenceNumber,
            courierId: input.courierId || null,
            courierOtherName: input.courierOtherName || null,
            trackingNumber: input.trackingNumber || null,
            parcelCategoryId: input.parcelCategoryId || null,
            description: input.description || null,
            storageSpotId: input.storageSpotId || null,
            isPerishable: input.isPerishable,
            isOversized: input.isOversized,
            notifyChannel: input.notifyChannel,
            createdById: auth.user.userId,
            status: 'unreleased',
          },
          include: {
            unit: { select: { number: true } },
          },
        });
      }),
    );

    // Log to PackageHistory for each created package
    try {
      const actor = await prisma.user.findUnique({
        where: { id: auth.user.userId },
        select: { firstName: true, lastName: true },
      });
      const actorName = actor ? `${actor.firstName} ${actor.lastName}`.trim() : 'System';

      await Promise.all(
        created.map((pkg) =>
          prisma.packageHistory.create({
            data: {
              packageId: pkg.id,
              action: 'received',
              details: `Package ${pkg.referenceNumber} logged (batch) for unit ${pkg.unit?.number ?? 'unknown'}`,
              actorId: auth.user.userId,
              actorName,
            },
          }),
        ),
      );
    } catch {
      // Non-critical
    }

    // Send batch notifications (fire-and-forget)
    void (async () => {
      try {
        // Group packages by unit to send one email per unit
        const byUnit = new Map<string, typeof created>();
        for (const pkg of created) {
          const existing = byUnit.get(pkg.unitId) ?? [];
          existing.push(pkg);
          byUnit.set(pkg.unitId, existing);
        }

        for (const [unitId, pkgs] of byUnit) {
          const residents = await getUnitResidentEmails(unitId);
          const refNumbers = pkgs.map((p) => p.referenceNumber).join(', ');
          for (const resident of residents) {
            void sendEmail({
              to: resident.email,
              subject: `${pkgs.length} package${pkgs.length > 1 ? 's' : ''} received`,
              html: renderTemplate('package_received', {
                residentName: resident.firstName,
                packageRef: refNumbers,
                unitNumber: pkgs[0]?.unit?.number ?? '',
              }),
            }).catch(() => {});
          }
        }
      } catch {
        // Non-critical
      }
    })();

    return NextResponse.json(
      {
        data: created,
        message: `${created.length} packages logged successfully.`,
        meta: {
          count: created.length,
          referenceNumbers: created.map((p) => p.referenceNumber),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/packages/batch error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create batch packages' },
      { status: 500 },
    );
  }
}
