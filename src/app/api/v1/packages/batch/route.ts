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

    // TODO: Send batch notifications
    // TODO: Log to PackageHistory for each

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
