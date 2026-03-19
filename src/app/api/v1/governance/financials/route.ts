/**
 * Board Governance — Financial Reports API
 *
 * GET /api/v1/governance/financials — P&L summary and budget tracking
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

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const period = searchParams.get('period');
    const includeBudget = searchParams.get('includeBudget') === 'true';

    const where: Record<string, unknown> = { propertyId };
    if (period) where.period = period;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const financials = await (prisma.financialReport.findMany as any)({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const response: Record<string, unknown> = { data: financials };

    if (includeBudget) {
      const budgetWhere: Record<string, unknown> = { propertyId };
      if (period) budgetWhere.period = period;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const budgetItems = await (prisma.budgetLineItem.findMany as any)({
        where: budgetWhere,
        orderBy: { category: 'asc' },
      });

      response.budget = budgetItems;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/v1/governance/financials error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch financials' },
      { status: 500 },
    );
  }
}
