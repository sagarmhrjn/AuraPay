import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../constants/auth.const';
import { User } from '../models/auth.model';
import { createJwt } from '../utils/jwt.util';
import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService', () => {
  const user: User = {
    id: 'usr-sales-01',
    name: 'Aayush Shrestha',
    email: 'aayush.shrestha@aurapay.np',
    role: 'SALES',
    title: 'Sales Officer',
    department: 'Commercial Partnerships',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthSessionService],
    });
  });

  it('starts unauthenticated when no session is stored', () => {
    const service = TestBed.inject(AuthSessionService);

    expect(service.currentUser()).toBeNull();
    expect(service.accessToken()).toBeNull();
    expect(service.refreshTokenValue()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('restores a valid persisted session', () => {
    const accessToken = createJwt({ sub: user.id }, 3600);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-token');

    const service = TestBed.inject(AuthSessionService);

    expect(service.currentUser()).toEqual(user);
    expect(service.accessToken()).toBe(accessToken);
    expect(service.refreshTokenValue()).toBe('refresh-token');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('clears an expired persisted session during initialization', () => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, createJwt({ sub: user.id }, -1));
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'expired-refresh-token');

    const service = TestBed.inject(AuthSessionService);

    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
  });

  it('does not restore a session with malformed stored user data', () => {
    localStorage.setItem(STORAGE_KEYS.USER, '{invalid-json');
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, createJwt({ sub: user.id }, 3600));

    const service = TestBed.inject(AuthSessionService);

    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.accessToken()).toBeNull();
  });

  it('persists user and tokens only when establishing a remembered session', () => {
    const service = TestBed.inject(AuthSessionService);

    service.establishSession(user, 'access-token', 'refresh-token', true);

    expect(service.isAuthenticated()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.USER)).toBe(JSON.stringify(user));
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('access-token');
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refresh-token');
  });

  it('keeps a non-remembered session in memory only', () => {
    const service = TestBed.inject(AuthSessionService);

    service.establishSession(user, 'temporary-access', 'temporary-refresh', false);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()).toEqual(user);
    expect(service.accessToken()).toBe('temporary-access');
    expect(service.refreshTokenValue()).toBe('temporary-refresh');
    expect(localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
  });

  it('updates token signals and persists refreshed tokens when requested', () => {
    const service = TestBed.inject(AuthSessionService);

    service.setTokens('new-access', 'new-refresh', true);

    expect(service.accessToken()).toBe('new-access');
    expect(service.refreshTokenValue()).toBe('new-refresh');
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('new-access');
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('new-refresh');
  });

  it('clears session signals and all stored session values', () => {
    const service = TestBed.inject(AuthSessionService);
    service.establishSession(user, 'access-token', 'refresh-token', true);

    service.clearSession();

    expect(service.currentUser()).toBeNull();
    expect(service.accessToken()).toBeNull();
    expect(service.refreshTokenValue()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
  });
});
