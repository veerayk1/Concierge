/**
 * Purchase Orders API — List & Create
 *
 * Tracks building expenditures with vendor assignment, budget categories,
 * approval workflow, and invoice matching.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createPurchaseOrderSchema } from '@/schemas/purchase-order';
import { nanoid } from 'nanoid';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

/** Roles permitted to create / manage purchase orders */
const PO_ALLOWED_ROLES = ['property_admin', 'board_member', 'property_manager', 'super_admin'];

// ---------------------------------------------------------------------------
// GET /api/v1/purchase-orders — List POs with optional spending summary
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search') || '';
    const summary = searchParams.get('summary');
    const month = searchParams.get('month'); // e.g. "2026-03"
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // -----------------------------------------------------------------------
    // Monthly spending summary by category
    // -----------------------------------------------------------------------
    if (summary === 'spending') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const whereClause: Record<string, any> = {
        propertyId,
        deletedAt: null,
        status: { in: ['approved', 'ordered', 'received', 'closed'] },
      };

      if (month) {
        const [year, mon] = month.split('-');
        const startDate = new Date(`${year}-${mon}-01T00:00:00.000Z`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        whereClause.createdAt = { gte: startDate, lt: endDate };
      }

      const spendingByCategory = await prisma.purchaseOrder.groupBy({
        by: ['budgetCategory'],
        where: whereClause,
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
      });

      return NextResponse.json({ data: spendingByCategory });
    }

    // -----------------------------------------------------------------------
    // Standard list with filtering, search, pagination
    // -----------------------------------------------------------------------
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { propertyId, deletedAt: null };
    if (status) where.status = status;
    if (category) where.budgetCategory = category;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { vendor: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          vendor: { select: { id: true, companyName: true } },
          items: true,
          attachments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return NextResponse.json({
      data: purchaseOrders,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/purchase-orders error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch purchase orders' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/purchase-orders — Create PO
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    // Role check — only financial roles can create POs
    if (!PO_ALLOWED_ROLES.includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions to create purchase orders' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createPurchaseOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const referenceNumber = `PO-${nanoid(6).toUpperCase()}`;

    // Calculate totals
    const items = input.items.map((item) => ({
      description: stripControlChars(stripHtml(item.description)),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }));
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    // Budget check — look up remaining budget for this category
    let warning: string | undefined;
    let budgetRemaining: number | undefined;

    const budgetLine = await prisma.budgetLineItem.findFirst({
      where: {
        propertyId: input.propertyId,
        category: input.budgetCategory,
      },
    });

    if (budgetLine) {
      const remaining = budgetLine.plannedAmount - budgetLine.actualAmount;
      if (totalAmount > remaining) {
        warning = `This PO is over budget. ${input.budgetCategory} has $${remaining.toLocaleString()} remaining but this PO totals $${totalAmount.toLocaleString()}.`;
        budgetRemaining = remaining;
      }
    }

    // Build create data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: Record<string, any> = {
      propertyId: input.propertyId,
      vendorId: input.vendorId,
      budgetCategory: stripControlChars(stripHtml(input.budgetCategory)),
      priority: input.priority || 'normal',
      referenceNumber,
      status: 'draft',
      totalAmount,
      expectedDelivery: input.expectedDelivery ? new Date(input.expectedDelivery) : null,
      notes: input.notes ? stripControlChars(stripHtml(input.notes)) : null,
      createdById: auth.user.userId,
      items: {
        create: items,
      },
      attachments: {
        create: [] as Array<Record<string, unknown>>,
      },
    };

    // Attachments (quotes, receipts)
    if (body.attachments && Array.isArray(body.attachments)) {
      createData.attachments = {
        create: body.attachments.map(
          (att: { key: string; fileName: string; contentType: string; fileSizeBytes: number }) => ({
            propertyId: input.propertyId,
            fileName: att.fileName,
            fileType: att.contentType,
            fileSizeBytes: att.fileSizeBytes,
            storageUrl: att.key,
            uploadedById: auth.user.userId,
          }),
        ),
      };
    }

    // Invoice matching — optional fields for linking an invoice at creation time
    if (body.invoiceNumber) {
      createData.invoiceNumber = stripControlChars(stripHtml(body.invoiceNumber));
      createData.invoiceDate = body.invoiceDate ? new Date(body.invoiceDate) : null;
      createData.invoiceAmount = body.invoiceAmount ?? null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const po = await (prisma.purchaseOrder.create as any)({
      data: createData,
      include: {
        vendor: { select: { id: true, companyName: true } },
        items: true,
        attachments: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: Record<string, any> = {
      data: po,
      message: `Purchase order ${referenceNumber} created.`,
    };

    if (warning) {
      response.warning = warning;
      response.budgetRemaining = budgetRemaining;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/purchase-orders error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create purchase order' },
      { status: 500 },
    );
  }
}
