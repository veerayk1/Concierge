/**
 * Module Email Configuration API
 * Per GAP 16.3 — Per-module "from" email addresses
 * Per GAP 16.1 — Auto-CC email lists per module type
 *
 * GET   /api/v1/settings/email-config — Get email config for property
 * POST  /api/v1/settings/email-config — Create module email config
 * PATCH /api/v1/settings/email-config/:moduleKey — Update a module's from email/name
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// Module email configuration keys
const EMAIL_MODULES = [
  'packages',
  'maintenance',
  'announcements',
  'security',
  'amenities',
  'events',
  'visitors',
  'general',
];

// ---------------------------------------------------------------------------
// GET /api/v1/settings/email-config
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: ['property_admin', 'super_admin'],
    });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const configs = await prisma.$queryRaw<any[]>`
      SELECT * FROM module_email_configs
      WHERE "propertyId" = ${propertyId}::uuid
      ORDER BY "moduleKey" ASC
    `;

    return NextResponse.json({
      data: {
        propertyId,
        configs,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/settings/email-config error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch email config' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/settings/email-config — Create module email config
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: ['property_admin', 'super_admin'],
    });
    if (auth.error) return auth.error;

    const body = await request.json();
    const { propertyId, moduleKey, fromEmail, fromName, replyTo, isActive } = body;

    if (!propertyId || !moduleKey || !fromEmail || !fromName) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'propertyId, moduleKey, fromEmail, and fromName are required',
        },
        { status: 400 },
      );
    }

    if (!EMAIL_MODULES.includes(moduleKey)) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Invalid module. Valid options: ${EMAIL_MODULES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Validate email formats
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

    if (replyTo && !emailRegex.test(replyTo)) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'replyTo must be a valid email address',
        },
        { status: 400 },
      );
    }

    const sanitizedFromName = stripControlChars(stripHtml(fromName));
    const config = await prisma.$queryRaw<any[]>`
      INSERT INTO module_email_configs (
        id, "propertyId", "moduleKey", "fromEmail", "fromName", "replyTo", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        ${propertyId}::uuid,
        ${moduleKey},
        ${fromEmail},
        ${sanitizedFromName},
        ${replyTo || null},
        NOW(),
        NOW()
      )
      ON CONFLICT ("propertyId", "moduleKey")
      DO UPDATE SET
        "fromEmail" = EXCLUDED."fromEmail",
        "fromName" = EXCLUDED."fromName",
        "replyTo" = EXCLUDED."replyTo",
        "updatedAt" = NOW()
      RETURNING *
    `;

    return NextResponse.json(
      {
        data: config[0],
        message: `Email configuration for "${moduleKey}" has been created.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/settings/email-config error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create email config' },
      { status: 500 },
    );
  }
}
