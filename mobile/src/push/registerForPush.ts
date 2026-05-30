/**
 * Push notification registration.
 *
 * Flow:
 *   1. Ask the user for permission (iOS: explicit prompt; Android 13+:
 *      explicit prompt; Android <13: granted by default).
 *   2. Get the Expo push token (an opaque string that abstracts over
 *      APNs + FCM device tokens).
 *   3. POST it to /api/v1/users/me/devices on the backend so the
 *      server can address this device by user ID.
 *
 * The token is stable per install. We re-register on every cold
 * start so the backend always has the latest `lastSeenAt`.
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiCall, ApiError } from '@/api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface DeviceRegistration {
  platform: 'ios' | 'android';
  token: string;
  deviceName?: string;
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    // Push doesn't work on the simulator — return early so we don't
    // hit Expo's "must use physical device" runtime error in dev.
    return null;
  }

  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;
  if (existing.status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0F172A',
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.['eas.projectId'];

  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId: projectId as string } : undefined,
    );
    const token = tokenResult.data;

    // Tell our backend about the token. Best-effort — push will retry
    // on next cold start if the network is offline now.
    const payload: DeviceRegistration = {
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      token,
      deviceName: Device.deviceName ?? undefined,
    };
    try {
      await apiCall<void>('/api/v1/users/me/devices', {
        method: 'POST',
        body: payload,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // User signed out between launch and registration — ignore.
      } else {
        console.warn('[push] device registration failed', err);
      }
    }

    return token;
  } catch (err) {
    console.warn('[push] getExpoPushTokenAsync failed', err);
    return null;
  }
}

/**
 * Remove this device's push registration. Called on sign-out so a
 * subsequent user on the same phone doesn't receive the previous
 * user's notifications.
 */
export async function unregisterPush(token: string): Promise<void> {
  try {
    await apiCall<void>(`/api/v1/users/me/devices`, {
      method: 'DELETE',
      body: { token },
    });
  } catch (err) {
    console.warn('[push] device unregister failed', err);
  }
}
