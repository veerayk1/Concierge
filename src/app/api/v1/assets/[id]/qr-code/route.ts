/**
 * Asset QR Code API — Generate QR codes for asset tags
 * Returns an SVG QR code as a data URL for printing on asset tags.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { generateQrSvgDataUrl } from '@/server/assets/qr-generator';

// ---------------------------------------------------------------------------
// GET /api/v1/assets/:id/qr-code — Generate QR code for asset
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const asset = await (prisma as any).asset.findUnique({
      where: { id },
      select: { id: true, propertyId: true, tagNumber: true },
    });

    if (!asset) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Asset not found' }, { status: 404 });
    }

    const qrContent = JSON.stringify({
      type: 'asset',
      id: asset.id,
      tag: asset.tagNumber,
    });

    const qrDataUrl = generateQrSvgDataUrl(qrContent);

    return NextResponse.json({
      data: {
        assetId: asset.id,
        tagNumber: asset.tagNumber,
        qrDataUrl,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/assets/:id/qr-code error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to generate QR code' },
      { status: 500 },
    );
  }
}
