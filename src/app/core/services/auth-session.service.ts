import { Injectable, computed, signal } from '@angular/core';
import { STORAGE_KEYS } from '../constants/auth.const';
import { User } from '../models/auth.model';
import { isTokenExpired } from '../utils/jwt.util';

/** Reads a session value from browser storage when storage is available. */
function getStoredItem(key: string): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

/** Persists a session value when browser storage is available. */
function setStoredItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/** Removes a session value from browser storage when available. */
function removeStoredItem(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore
  }
}

/** Removes every persisted value that makes up the current session. */
function clearStoredSession(): void {
  removeStoredItem(STORAGE_KEYS.ACCESS_TOKEN);
  removeStoredItem(STORAGE_KEYS.REFRESH_TOKEN);
  removeStoredItem(STORAGE_KEYS.USER);
}

/** Restores a valid user session from browser storage, clearing expired or invalid data. */
function loadInitialSession(): { user: User | null; token: string | null; refreshToken: string | null } {
  const token = getStoredItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = getStoredItem(STORAGE_KEYS.REFRESH_TOKEN);
  const userJson = getStoredItem(STORAGE_KEYS.USER);

  if (token && userJson) {
    if (token.includes('.') && isTokenExpired(token)) {
      clearStoredSession();
      return { user: null, token: null, refreshToken: null };
    }
    try {
      const user = JSON.parse(userJson) as User;
      return { user, token, refreshToken };
    } catch {
      return { user: null, token: null, refreshToken: null };
    }
  }

  return { user: null, token: null, refreshToken: null };
}

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly initialSession = loadInitialSession();

  readonly currentUser = signal<User | null>(this.initialSession.user);
  readonly accessToken = signal<string | null>(this.initialSession.token);
  readonly refreshTokenValue = signal<string | null>(this.initialSession.refreshToken);
  readonly isAuthenticated = computed(() => !!this.currentUser() && !!this.accessToken());

  /** Activates a user session and optionally persists it for the next visit. */
  establishSession(
    user: User,
    accessToken: string,
    refreshToken: string,
    persist: boolean
  ): void {
    this.currentUser.set(user);
    this.setTokens(accessToken, refreshToken, persist);

    if (persist) {
      setStoredItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  }

  /** Updates access and refresh tokens, optionally persisting them. */
  setTokens(accessToken: string | null, refreshToken: string | null, persist = false): void {
    this.accessToken.set(accessToken);
    this.refreshTokenValue.set(refreshToken);

    if (persist) {
      if (accessToken !== null) {
        setStoredItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      }
      if (refreshToken !== null) {
        setStoredItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
    }
  }

  /** Clears the active session and its persisted values. */
  clearSession(): void {
    this.currentUser.set(null);
    this.setTokens(null, null);
    clearStoredSession();
  }

  /** Replaces the active user without changing persisted session data. */
  setCurrentUser(user: User | null): void {
    this.currentUser.set(user);
  }

  /** Replaces the active access token without changing persisted session data. */
  setAccessToken(token: string | null): void {
    this.accessToken.set(token);
  }
}
