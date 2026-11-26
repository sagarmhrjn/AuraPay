import { describe, expect, it } from 'vitest';
import { createJwt, decodeJwt, getTokenRemainingSeconds, isTokenExpired } from './jwt.util';
import { JwtPayload } from '../models/auth.model';

describe('JWT Utilities', () => {
  const samplePayload = {
    sub: 'usr-sales-01',
    name: 'Aayush Shrestha',
    email: 'aayush.shrestha@aurapay.np',
    role: 'SALES',
    permissions: ['CAN_CREATE_APPLICATION'],
  };

  it('should generate an RFC 7519 3-part base64url encoded JWT', () => {
    const token = createJwt(samplePayload, 3600);
    expect(token).toBeDefined();
    const parts = token.split('.');
    expect(parts.length).toBe(3);
  });

  it('should decode a valid JWT payload accurately', () => {
    const token = createJwt(samplePayload, 3600);
    const decoded = decodeJwt<JwtPayload>(token);

    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe('usr-sales-01');
    expect(decoded?.name).toBe('Aayush Shrestha');
    expect(decoded?.email).toBe('aayush.shrestha@aurapay.np');
    expect(decoded?.role).toBe('SALES');
    expect(decoded?.permissions).toContain('CAN_CREATE_APPLICATION');
    expect(decoded?.iss).toBe('aurapay-nepal-auth');
    expect(decoded?.exp).toBeGreaterThan(decoded?.iat ?? 0);
  });

  it('should identify active token as not expired', () => {
    const token = createJwt(samplePayload, 3600);
    expect(isTokenExpired(token)).toBe(false);
    expect(getTokenRemainingSeconds(token)).toBeGreaterThan(3500);
  });

  it('should identify expired token with negative/zero expiration', () => {
    const expiredToken = createJwt(samplePayload, -10);
    expect(isTokenExpired(expiredToken)).toBe(true);
    expect(getTokenRemainingSeconds(expiredToken)).toBe(0);
  });

  it('should handle malformed or empty token strings gracefully', () => {
    expect(decodeJwt('')).toBeNull();
    expect(decodeJwt(null)).toBeNull();
    expect(decodeJwt('not.a.valid.jwt.token')).toBeNull();
    expect(decodeJwt('random-garbage')).toBeNull();
    expect(isTokenExpired('')).toBe(true);
    expect(isTokenExpired(null)).toBe(true);
  });
});
