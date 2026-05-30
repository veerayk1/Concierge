/**
 * Token storage — SecureStore wrapper.
 *
 * On iOS, expo-secure-store uses the Keychain. On Android, it uses
 * the Keystore-backed EncryptedSharedPreferences. Tokens never touch
 * AsyncStorage or the JS heap longer than needed.
 *
 * The web equivalent in src/lib/api-client.ts uses localStorage,
 * which is fine for browsers but unacceptable for a native app —
 * any other app on the device could read AsyncStorage on a rooted
 * Android phone.
 */

import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'concierge.auth.access';
const REFRESH_KEY = 'concierge.auth.refresh';
const USER_KEY = 'concierge.auth.user';

export interface StoredUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  propertyId?: string;
  unitId?: string;
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function setAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getStoredUser(): Promise<StoredUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    // Corrupt entry — wipe so we never trip on it again.
    await SecureStore.deleteItemAsync(USER_KEY);
    return null;
  }
}

export async function setStoredUser(user: StoredUser): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearAllAuth(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}
