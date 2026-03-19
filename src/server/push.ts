/**
 * Concierge — Push Notification Service
 *
 * Sends push notifications via Firebase Cloud Messaging (FCM) HTTP v1 API.
 * Uses `fetch` directly — no Firebase SDK dependency.
 *
 * Behaviour:
 * - If `FIREBASE_PROJECT_ID` is not set, notifications are logged but not sent (dev mode).
 * - Failures are logged but never thrown — callers are not disrupted.
 * - Device tokens are stored in the DevicePushToken table.
 *
 * @module server/push
 */

import { SignJWT, importPKCS8 } from 'jose';
import { createLogger } from '@/server/logger';
import { prisma } from '@/server/db';

const logger = createLogger('push');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT_KEY = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const FCM_API_URL = FIREBASE_PROJECT_ID
  ? `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`
  : '';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PushNotificationPayload {
  /** FCM device token. */
  token: string;
  /** Notification title. */
  title: string;
  /** Notification body text. */
  body: string;
  /** Optional custom data for deep linking. All values must be strings. */
  data?: Record<string, string>;
}

export interface NotificationContent {
  /** Notification title. */
  title: string;
  /** Notification body text. */
  body: string;
  /** Optional custom data for deep linking. */
  data?: Record<string, string>;
}

export interface UserPushResult {
  sent: number;
  failed: number;
}

export interface PropertyPushResult {
  totalSent: number;
  totalFailed: number;
  userCount: number;
}

// ---------------------------------------------------------------------------
// OAuth2 Token Generation
// ---------------------------------------------------------------------------

/**
 * Generate a short-lived OAuth2 access token using the service account key.
 * Uses a self-signed JWT exchanged for a Google OAuth2 access token.
 */
async function getAccessToken(): Promise<string | null> {
  if (!FIREBASE_SERVICE_ACCOUNT_KEY) {
    logger.warn('FIREBASE_SERVICE_ACCOUNT_KEY not set — cannot generate access token');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_KEY);
    const privateKey = await importPKCS8(serviceAccount.private_key, 'RS256');

    const now = Math.floor(Date.now() / 1000);
    const jwt = await new SignJWT({
      scope: FCM_SCOPE,
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuer(serviceAccount.client_email)
      .setSubject(serviceAccount.client_email)
      .setAudience(GOOGLE_TOKEN_URL)
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(privateKey);

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error({ status: response.status, error }, 'Failed to get OAuth2 access token');
      return null;
    }

    const data = await response.json();
    return data.access_token as string;
  } catch (err) {
    logger.error({ err }, 'Failed to generate OAuth2 token');
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core: sendPushNotification
// ---------------------------------------------------------------------------

/**
 * Send a single push notification to a device via FCM HTTP v1 API.
 *
 * Returns `true` on success, `false` on any failure (including dev mode skip).
 * Never throws.
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
  if (!FIREBASE_PROJECT_ID) {
    logger.warn(
      { token: payload.token, title: payload.title },
      'FIREBASE_PROJECT_ID not set — skipping push notification (development mode)',
    );
    return false;
  }

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return false;
    }

    const fcmMessage: Record<string, unknown> = {
      message: {
        token: payload.token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        ...(payload.data ? { data: payload.data } : {}),
      },
    };

    const response = await fetch(FCM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(fcmMessage),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error(
        { token: payload.token, status: response.status, error },
        'FCM API returned an error',
      );
      return false;
    }

    logger.info({ token: payload.token, title: payload.title }, 'Push notification sent');
    return true;
  } catch (err) {
    logger.error({ token: payload.token, err }, 'Failed to send push notification');
    return false;
  }
}

// ---------------------------------------------------------------------------
// sendPushToUser — send to all of a user's registered devices
// ---------------------------------------------------------------------------

/**
 * Look up a user's registered FCM tokens and send a notification to all devices.
 * Never throws.
 */
export async function sendPushToUser(
  userId: string,
  notification: NotificationContent,
): Promise<UserPushResult> {
  try {
    const tokens = await prisma.devicePushToken.findMany({
      where: { userId },
    });

    if (tokens.length === 0) {
      logger.debug({ userId }, 'No push tokens found for user');
      return { sent: 0, failed: 0 };
    }

    const results = await Promise.allSettled(
      tokens.map((t: { token: string }) =>
        sendPushNotification({
          token: t.token,
          title: notification.title,
          body: notification.body,
          data: notification.data,
        }),
      ),
    );

    let sent = 0;
    let failed = 0;
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        sent++;
      } else {
        failed++;
      }
    }

    logger.info({ userId, sent, failed, total: tokens.length }, 'Push notifications sent to user');
    return { sent, failed };
  } catch (err) {
    logger.error({ userId, err }, 'Failed to send push notifications to user');
    return { sent: 0, failed: 0 };
  }
}

// ---------------------------------------------------------------------------
// sendPushToProperty — send to all users in a property
// ---------------------------------------------------------------------------

/**
 * Send a push notification to all users belonging to a property.
 * Looks up UserProperty records, then sends to each user's devices.
 * Never throws.
 */
export async function sendPushToProperty(
  propertyId: string,
  notification: NotificationContent,
): Promise<PropertyPushResult> {
  try {
    const userProperties = await prisma.userProperty.findMany({
      where: { propertyId, deletedAt: null },
      select: { userId: true },
    });

    if (userProperties.length === 0) {
      logger.debug({ propertyId }, 'No users found in property for push notification');
      return { totalSent: 0, totalFailed: 0, userCount: 0 };
    }

    const results = await Promise.allSettled(
      userProperties.map((up: { userId: string }) => sendPushToUser(up.userId, notification)),
    );

    let totalSent = 0;
    let totalFailed = 0;
    for (const result of results) {
      if (result.status === 'fulfilled') {
        totalSent += result.value.sent;
        totalFailed += result.value.failed;
      }
    }

    logger.info(
      { propertyId, userCount: userProperties.length, totalSent, totalFailed },
      'Push notifications sent to property',
    );
    return { totalSent, totalFailed, userCount: userProperties.length };
  } catch (err) {
    logger.error({ propertyId, err }, 'Failed to send push notifications to property');
    return { totalSent: 0, totalFailed: 0, userCount: 0 };
  }
}

// ---------------------------------------------------------------------------
// Token Management
// ---------------------------------------------------------------------------

/**
 * Register a device push token for a user.
 * Removes any existing entry for the same token first (device may have changed users).
 * Never throws.
 */
export async function registerPushToken(
  userId: string,
  token: string,
  platform: string,
): Promise<boolean> {
  try {
    // Remove existing registration for this token (device may switch users)
    await prisma.devicePushToken.deleteMany({ where: { token } });

    await prisma.devicePushToken.create({
      data: {
        userId,
        token,
        platform,
      },
    });

    logger.info({ userId, platform }, 'Push token registered');
    return true;
  } catch (err) {
    logger.error({ userId, err }, 'Failed to register push token');
    return false;
  }
}

/**
 * Unregister a device push token (e.g. on logout or token refresh).
 * Never throws.
 */
export async function unregisterPushToken(token: string): Promise<boolean> {
  try {
    await prisma.devicePushToken.deleteMany({ where: { token } });
    logger.info('Push token unregistered');
    return true;
  } catch (err) {
    logger.error({ err }, 'Failed to unregister push token');
    return false;
  }
}
