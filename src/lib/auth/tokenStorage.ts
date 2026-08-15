/**
 * Token persistence via expo-secure-store (Keychain/Keystore-backed).
 * Never AsyncStorage — these are credentials.
 */
import * as SecureStore from "expo-secure-store";
import type { AuthTokens } from "../../types/auth";

const ACCESS_KEY = "celiyo.access_token";
const REFRESH_KEY = "celiyo.refresh_token";

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, tokens.access),
    SecureStore.setItemAsync(REFRESH_KEY, tokens.refresh),
  ]);
}

export async function loadTokens(): Promise<AuthTokens | null> {
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  if (!access || !refresh) return null;
  return { access, refresh };
}

export async function saveAccessToken(access: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}
