/**
 * Temporary migration endpoint to create gap analysis tables.
 * This creates fire_logs, noise_complaints, consent_documents, and module_email_configs tables.
 * Should be removed after migration is applied.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: ['property_admin', 'super_admin'],
    });
    if (auth.error) return auth.error;

    const results: string[] = [];

    // Create fire_logs table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS fire_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "propertyId" UUID NOT NULL REFERENCES properties(id),
          "eventId" UUID,
          "alarmTime" TIMESTAMP WITH TIME ZONE,
          "alarmLocation" VARCHAR(255),
          "alarmType" VARCHAR(50),
          "fireDeptCallTime" TIMESTAMP WITH TIME ZONE,
          "firstAnnouncementTime" TIMESTAMP WITH TIME ZONE,
          "secondAnnouncementTime" TIMESTAMP WITH TIME ZONE,
          "thirdAnnouncementTime" TIMESTAMP WITH TIME ZONE,
          "fireDeptArrivalTime" TIMESTAMP WITH TIME ZONE,
          "fireDeptAllClearTime" TIMESTAMP WITH TIME ZONE,
          "fireDeptDepartureTime" TIMESTAMP WITH TIME ZONE,
          "prepareForFdArrival" JSONB,
          "ensureElevatorsReset" JSONB,
          "resetDevices" JSONB,
          "additionalNotes" TEXT,
          "createdById" UUID,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "deletedAt" TIMESTAMP WITH TIME ZONE
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_fire_logs_property_alarm ON fire_logs ("propertyId", "alarmTime")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_fire_logs_property_created ON fire_logs ("propertyId", "createdAt")`);
      results.push('fire_logs: created');
    } catch (e: any) {
      results.push(`fire_logs: ${e.message}`);
    }

    // Create noise_complaints table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS noise_complaints (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "propertyId" UUID NOT NULL REFERENCES properties(id),
          "complainantFloor" VARCHAR(50),
          "suspectFloor" VARCHAR(50),
          "noiseDuration" VARCHAR(100),
          "noiseVolume" INTEGER,
          "natureOfComplaint" TEXT[] DEFAULT '{}',
          "suspectContactMethod" VARCHAR(50),
          "counselingNotes" TEXT,
          "resolutionStatus" VARCHAR(50) DEFAULT 'pending',
          "createdById" UUID,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "deletedAt" TIMESTAMP WITH TIME ZONE
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_noise_complaints_property ON noise_complaints ("propertyId", "createdAt")`);
      results.push('noise_complaints: created');
    } catch (e: any) {
      results.push(`noise_complaints: ${e.message}`);
    }

    // Create consent_documents table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS consent_documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "propertyId" UUID NOT NULL REFERENCES properties(id),
          "userId" UUID,
          "documentType" VARCHAR(100),
          "documentUrl" TEXT,
          "signedAt" TIMESTAMP WITH TIME ZONE,
          "expiresAt" TIMESTAMP WITH TIME ZONE,
          "ipAddress" VARCHAR(45),
          "userAgent" TEXT,
          "isRevoked" BOOLEAN DEFAULT false,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
      results.push('consent_documents: created');
    } catch (e: any) {
      results.push(`consent_documents: ${e.message}`);
    }

    // Create module_email_configs table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS module_email_configs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "propertyId" UUID NOT NULL REFERENCES properties(id),
          "moduleKey" VARCHAR(100) NOT NULL,
          "fromEmail" VARCHAR(255),
          "fromName" VARCHAR(255),
          "replyTo" VARCHAR(255),
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          UNIQUE("propertyId", "moduleKey")
        )
      `);
      results.push('module_email_configs: created');
    } catch (e: any) {
      results.push(`module_email_configs: ${e.message}`);
    }

    // Create vacation_periods table if not exists
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS vacation_periods (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "propertyId" UUID NOT NULL REFERENCES properties(id),
          "userId" UUID,
          "unitId" UUID,
          "startDate" DATE NOT NULL,
          "endDate" DATE NOT NULL,
          "emergencyContact" VARCHAR(255),
          "emergencyPhone" VARCHAR(50),
          notes TEXT,
          status VARCHAR(50) DEFAULT 'upcoming',
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
      results.push('vacation_periods: created');
    } catch (e: any) {
      results.push(`vacation_periods: ${e.message}`);
    }

    // Fix vacation_periods unitId to be nullable (Prisma schema has it as NOT NULL but we need it optional)
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE vacation_periods ALTER COLUMN "unitId" DROP NOT NULL`);
      results.push('vacation_periods.unitId: made nullable');
    } catch (e: any) {
      results.push(`vacation_periods.unitId: ${e.message}`);
    }

    return NextResponse.json({
      message: 'Migration completed',
      results,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'MIGRATION_ERROR', message: String(error) },
      { status: 500 },
    );
  }
}
