/**
 * Module Email Configuration Detail API
 * Per GAP 16.3 — Per-module "from" email addresses
 *
 * PATCH  /api/v1/settings/email-config/:moduleKey — Update module email config
 * DELETE /api/v1/settings/email-config/:moduleKey — Delete module email config
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// PATCH /api/v1/settings/email-config/:moduleKey — Update configuration
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ moduleKey: string }> },
) {
  try {
    const auth = await guardRoute(request, {
      roles: ['property_admin', 'super_admin'],
    });
    if (auth.error) return auth.error;

    const { moduleKey } = await params;
    const body = await request.json();
    const { propertyId, fromEmail, fromName, replyTo, isActive } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Fetch existing config
    const existing = await prisma.moduleEmailConfig.findUnique({
      where: {
        propertyId_moduleKey: {
          propertyId,
          moduleKey,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Email config not found' },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};

    if (fromEmail !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fromEmail)) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: 'fromEmail must be a valid email address',
          },
          { status: 400 },
        );
      }
      updateData.fromEmail = fromEmail;
    }

    if (fromName !== undefined) {
      updateData.fromName = stripControlChars(stripHtml(fromName));
    }

    if (replyTo !== undefined) {
      if (replyTo) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(replyTo)) {
          return NextResponse.json(
            {
              error: 'VALIDATION_ERROR',
              message: 'replyTo must be a valid email address',
            },
            { status: 400 },
          );
        }
      }
      updateData.replyTo = replyTo || null;
    }

    if (isActive !== undefined) {
      updateData.isActive = !!isActive;
    }

    const config = await prisma.moduleEmailConfig.update({
      where: {
        propertyId_moduleKey: {
          propertyId,
          moduleKey,
        },
      },
      data: updateData,
    });

    return NextResponse.json({
      data: config,
      message: `Email configuration for "${moduleKey}" has been updated.`,
    });
  } catch (error) {
    console.error('PATCH /api/v1/settings/email-config/:moduleKey error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update email config' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/settings/email-config/:moduleKey — Delete configuration
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ moduleKey: string }> },
) {
  try {
    const auth = await guardRoute(request, {
      roles: ['property_admin', 'super_admin'],
    });
    if (auth.error) return auth.error;

    const { moduleKey } = await params;
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Fetch existing config
    const existing = await prisma.moduleEmailConfig.findUnique({
      where: {
        propertyId_moduleKey: {
          propertyId,
          moduleKey,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Email config not found' },
        { status: 404 },
      );
    }

    await prisma.moduleEmailConfig.delete({
      where: {
        propertyId_moduleKey: {
          propertyId,
          moduleKey,
        },
      },
    });

    return NextResponse.json({
      message: `Email configuration for "${moduleKey}" has been deleted.`,
    });
  } catch (error) {
    console.error('DELETE /api/v1/settings/email-config/:moduleKey error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete email config' },
      { status: 500 },
    );
  }
}
