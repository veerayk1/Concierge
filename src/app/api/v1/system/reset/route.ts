/**
 * System Reset API — Purge all data for a clean slate
 * Super Admin only. Truncates all tables.
 * Used for demo preparation and testing resets.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function POST(request: NextRequest) {
  // Skip demo handler — this always goes to real DB
  const demoRole = request.headers.get('x-demo-role');
  if (demoRole && demoRole !== 'super_admin') {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Only super_admin can reset the system.' },
      { status: 403 },
    );
  }

  // If not demo mode, check real auth
  if (!demoRole) {
    const auth = await guardRoute(request, { roles: ['super_admin'] });
    if (auth.error) return auth.error;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const confirm = body.confirm;

    if (confirm !== 'RESET_ALL_DATA') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Send { "confirm": "RESET_ALL_DATA" } to proceed.' },
        { status: 400 },
      );
    }

    // Use TRUNCATE CASCADE to force-clear all tables regardless of FK constraints
    await prisma.$executeRawUnsafe(`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        -- Disable triggers temporarily
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'ALTER TABLE "' || r.tablename || '" DISABLE TRIGGER ALL';
        END LOOP;

        -- Truncate all tables
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations') LOOP
          EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" CASCADE';
        END LOOP;

        -- Re-enable triggers
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'ALTER TABLE "' || r.tablename || '" ENABLE TRIGGER ALL';
        END LOOP;
      END $$;
    `);

    // Also reset the demo data store
    try {
      const { getDemoStore } = await import('@/server/demo/demo-data-store');
      const store = getDemoStore();
      store.seed('properties', []);
      store.seed('users', []);
      store.seed('units', []);
      store.seed('packages', []);
      store.seed('maintenance', []);
      store.seed('visitors', []);
      store.seed('announcements', []);
      store.seed('amenities', []);
      store.seed('bookings', []);
      store.seed('events', []);
      store.seed('training', []);
      store.seed('shiftLog', []);
      store.seed('incidents', []);
      store.seed('keys', []);
      store.seed('dashboard', []);
      store.seed('aiAnalytics', []);
      store.seed('billing', []);
      store.seed('maintenanceCategories', []);
    } catch {
      // Demo store reset is best-effort
    }

    return NextResponse.json({
      data: {
        message: 'All data has been purged. Platform is now a clean slate.',
      },
    });
  } catch (error) {
    console.error('POST /api/v1/system/reset error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message:
          'Failed to reset system: ' + (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 },
    );
  }
}
