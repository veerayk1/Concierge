/**
 * Billing Invoices API — GET list invoices
 *
 * Returns paginated invoice history for a property.
 *
 * Per PRD 24: Billing & Subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    if (!propertyId) {
      return NextResponse.json(
        {
          error: 'MISSING_PROPERTY',
          message: 'propertyId is required',
          code: 'MISSING_PROPERTY',
          requestId: '',
        },
        { status: 400 },
      );
    }

    const skip = (page - 1) * pageSize;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { propertyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.invoice.count({ where: { propertyId } }),
    ]);

    return NextResponse.json(
      {
        data: invoices.map((inv) => ({
          id: inv.id,
          subscriptionId: inv.subscriptionId,
          stripeInvoiceId: inv.stripeInvoiceId,
          amount: inv.amount,
          tax: inv.tax,
          currency: inv.currency,
          status: inv.status,
          pdfUrl: inv.pdfUrl,
          periodStart: inv.periodStart,
          periodEnd: inv.periodEnd,
          paidAt: inv.paidAt,
          createdAt: inv.createdAt,
        })),
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        requestId: request.headers.get('X-Request-ID') || '',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /billing/invoices error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch invoices',
        code: 'INTERNAL_ERROR',
        requestId: '',
      },
      { status: 500 },
    );
  }
}
