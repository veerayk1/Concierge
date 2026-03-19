/**
 * Announcements API — List & Create
 * Per PRD 09 Communication
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { sendPushToProperty } from '@/server/push';
import { createLogger } from '@/server/logger';

const logger = createLogger('announcements');

const createAnnouncementSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(10000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  channels: z.array(z.enum(['web', 'email', 'sms', 'push'])).min(1, 'Select at least one channel'),
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  scheduledAt: z.string().optional().or(z.literal('')),
  categoryId: z.string().uuid().optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId, deletedAt: null };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.announcement.count({ where }),
    ]);

    return NextResponse.json({
      data: announcements,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/announcements error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch announcements' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createAnnouncementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const announcement = await prisma.announcement.create({
      data: {
        propertyId: input.propertyId,
        title: stripControlChars(stripHtml(input.title)),
        content: stripControlChars(stripHtml(input.content)),
        priority: input.priority,
        channels: input.channels,
        status: input.status,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        categoryId: input.categoryId || null,
        createdById: auth.user.userId,
        publishedAt: input.status === 'published' ? new Date() : null,
      },
    });

    // Create delivery records for published announcements only.
    // Draft and scheduled announcements do NOT get delivery records at creation time.
    // Scheduled announcements will have records created by a cron job at publishedAt.
    if (input.status === 'published') {
      await createDeliveryRecords(announcement.id, input.propertyId, input.channels).catch(
        (err: unknown) => {
          logger.error(
            { err, announcementId: announcement.id },
            'Failed to create announcement delivery records',
          );
        },
      );

      // Send push notification for published announcements with push channel
      if (input.channels.includes('push')) {
        void sendPushToProperty(input.propertyId, {
          title: announcement.title,
          body: input.content.substring(0, 200),
          data: { announcementId: announcement.id, screen: 'announcements', action: 'view' },
        }).catch((err) => {
          logger.error(
            { err, announcementId: announcement.id },
            'Failed to send announcement push notification',
          );
        });
      }
    }

    return NextResponse.json(
      { data: announcement, message: 'Announcement created.' },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/announcements error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create announcement' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Delivery Record Creation
// ---------------------------------------------------------------------------

/**
 * Creates AnnouncementDelivery records for all target users in a property.
 *
 * For each user, checks their notification preferences to determine which
 * channels they have enabled. Only creates delivery records for channels
 * that are both requested by the announcement AND enabled by the user.
 *
 * Deduplicates by user+channel combination to prevent double-sends.
 */
async function createDeliveryRecords(
  announcementId: string,
  propertyId: string,
  channels: string[],
): Promise<void> {
  // Deduplicate channels from input
  const uniqueChannels = [...new Set(channels)];

  // Deliverable channels only (exclude 'web' — it's a display-only channel)
  const deliverableChannels = uniqueChannels.filter((ch) => ch !== 'web');

  if (deliverableChannels.length === 0) return;

  // Get all users in the property
  const userProperties = await prisma.userProperty.findMany({
    where: { propertyId, deletedAt: null },
    select: { userId: true },
  });

  if (userProperties.length === 0) return;

  const userIds = userProperties.map((up: { userId: string }) => up.userId);

  // Get notification preferences for all users in this property for announcements
  const preferences = await prisma.notificationPreference.findMany({
    where: {
      userId: { in: userIds },
      module: 'announcements',
      channel: { in: deliverableChannels },
    },
  });

  // Build a lookup: userId -> Set of enabled channels
  const enabledChannels = new Map<string, Set<string>>();
  for (const pref of preferences) {
    if (pref.enabled) {
      if (!enabledChannels.has(pref.userId)) {
        enabledChannels.set(pref.userId, new Set());
      }
      enabledChannels.get(pref.userId)!.add(pref.channel);
    }
  }

  // For users with no preference records, default to all deliverable channels enabled
  for (const userId of userIds) {
    if (!enabledChannels.has(userId)) {
      // Check if user has ANY preference records
      const hasPrefs = preferences.some((p: { userId: string }) => p.userId === userId);
      if (!hasPrefs) {
        enabledChannels.set(userId, new Set(deliverableChannels));
      }
    }
  }

  // Build delivery records — one per user per enabled channel
  const seen = new Set<string>();
  const deliveryData: Array<{
    announcementId: string;
    recipientId: string;
    channel: string;
    status: string;
    sentAt: null;
  }> = [];

  for (const userId of userIds) {
    const userChannels = enabledChannels.get(userId);
    if (!userChannels) continue;

    for (const channel of deliverableChannels) {
      if (!userChannels.has(channel)) continue;

      const key = `${userId}:${channel}`;
      if (seen.has(key)) continue;
      seen.add(key);

      deliveryData.push({
        announcementId,
        recipientId: userId,
        channel,
        status: 'pending',
        sentAt: null,
      });
    }
  }

  if (deliveryData.length === 0) return;

  await prisma.announcementDelivery.createMany({
    data: deliveryData,
    skipDuplicates: true,
  });

  logger.info(
    { announcementId, deliveryCount: deliveryData.length },
    'Delivery records created for announcement',
  );
}
