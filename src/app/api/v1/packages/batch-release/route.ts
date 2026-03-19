/**
 * Batch Package Release API — per PRD 04
 * Release multiple packages at once (resident picks up all their packages)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const batchReleaseSchema = z.object({
  packageIds: z.array(z.string().uuid()).min(1, 'Select at least one package').max(20),
  releasedToName: z.string().min(2, 'Name is required').max(200),
  idVerified: z.boolean().default(false),
  isAuthorizedDelegate: z.boolean().default(false),
  releaseComments: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = batchReleaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const now = new Date();

    // Release all packages in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.package.updateMany({
        where: {
          id: { in: input.packageIds },
          status: 'unreleased',
          deletedAt: null,
        },
        data: {
          status: 'released',
          releasedToName: input.releasedToName,
          releasedAt: now,
          releasedById: auth.user.userId,
          idVerified: input.idVerified,
          isAuthorizedDelegate: input.isAuthorizedDelegate,
          releaseComments: input.releaseComments || null,
        },
      });

      // Log history for each package
      for (const pkgId of input.packageIds) {
        await tx.packageHistory.create({
          data: {
            packageId: pkgId,
            action: 'released',
            details: `Batch released to ${input.releasedToName}`,
            actorId: auth.user.userId,
            actorName: 'Staff',
          },
        });
      }

      return updated;
    });

    return NextResponse.json({
      message: `${result.count} packages released to ${input.releasedToName}.`,
      meta: { count: result.count },
    });
  } catch (error) {
    console.error('POST /api/v1/packages/batch-release error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Batch release failed' },
      { status: 500 },
    );
  }
}
