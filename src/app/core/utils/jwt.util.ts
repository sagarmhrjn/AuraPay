import { JwtPayload } from '../models/auth.model';

/**
 * Base64Url encoder compatible with browser and Node environments
 */
function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64Url decoder compatible with browser and Node environments
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Generates an RFC 7519 compliant JWT structure: header.payload.signature
 */
export function createJwt(
  payload: Record<string, unknown>,
  expiresInSeconds = 3600
): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const nowSeconds = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: nowSeconds,
    exp: nowSeconds + expiresInSeconds,
    iss: 'aurapay-nepal-auth',
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  // Deterministic pseudo-signature for demo/mock environment verification
  const pseudoSig = base64UrlEncode(
    `sig_${encodedHeader.slice(0, 8)}_${encodedPayload.slice(-8)}_${nowSeconds}`
  );

  return `${encodedHeader}.${encodedPayload}.${pseudoSig}`;
}

/**
 * Decodes and parses the payload of a JWT string
 */
export function decodeJwt<T = JwtPayload>(token: string | null | undefined): T | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const jsonStr = base64UrlDecode(parts[1]);
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

/**
 * Validates whether the given JWT token has expired based on its 'exp' claim
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  const decoded = decodeJwt<JwtPayload>(token);
  if (!decoded || !decoded.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp <= now;
}

/**
 * Returns remaining validity of token in seconds
 */
export function getTokenRemainingSeconds(token: string | null | undefined): number {
  if (!token) return 0;
  const decoded = decodeJwt<JwtPayload>(token);
  if (!decoded || !decoded.exp) return 0;
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - now);
}
