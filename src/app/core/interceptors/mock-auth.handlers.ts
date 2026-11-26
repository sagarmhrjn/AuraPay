import { HttpErrorResponse, HttpEvent, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import { User } from '../models/auth.model';
import { MOCK_USERS } from '../services/mock-data';
import { createJwt, decodeJwt } from '../utils/jwt.util';
import { setMockBackendTokenExpired } from './mock-api-state';

const mockUserAccounts = [...MOCK_USERS.SALES, ...MOCK_USERS.REVIEWER, MOCK_USERS.ADMIN];

/** Handles mock login, refresh, and logout endpoints. */
export function handleMockAuthRequest(
  req: HttpRequest<unknown>
): Observable<HttpEvent<unknown>> | null {
  if (req.url === '/auth/login' && req.method === 'POST') {
    const body = req.body as { email?: string; password?: string };
    const emailInput = body?.email?.toLowerCase().trim() || '';
    const password = body?.password || '';

    let matchedUser: User | undefined;
    if (
      emailInput === 'sales' ||
      emailInput === 'sales@aurapay.np' ||
      emailInput === MOCK_USERS.SALES[0].email.toLowerCase()
    ) {
      matchedUser = MOCK_USERS.SALES[0];
    } else if (
      emailInput === 'reviewer' ||
      emailInput === 'reviewer@aurapay.np' ||
      emailInput === MOCK_USERS.REVIEWER[0].email.toLowerCase()
    ) {
      matchedUser = MOCK_USERS.REVIEWER[0];
    } else if (
      emailInput === 'admin' ||
      emailInput === 'admin@aurapay.np' ||
      emailInput === MOCK_USERS.ADMIN.email.toLowerCase()
    ) {
      matchedUser = MOCK_USERS.ADMIN;
    } else {
      matchedUser = mockUserAccounts.find((user) => user.email.toLowerCase() === emailInput);
    }

    if (!matchedUser || !password || password.length < 4) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password. Please verify your credentials or select a demo persona.',
              timestamp: new Date().toISOString(),
            },
          })
      ).pipe(delay(200));
    }

    setMockBackendTokenExpired(false);
    const accessToken = createJwt(
      {
        sub: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
        title: matchedUser.title,
        department: matchedUser.department,
        assignedMerchantIds: matchedUser.assignedMerchantIds,
      },
      3600
    );
    const refreshToken = createJwt({ sub: matchedUser.id, type: 'refresh' }, 86400);

    return of(
      new HttpResponse({
        status: 200,
        body: {
          user: matchedUser,
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 3600,
            tokenType: 'Bearer',
          },
        },
      })
    ).pipe(delay(200));
  }

  if (req.url === '/auth/refresh' && req.method === 'POST') {
    const refreshToken = (req.body as { refreshToken?: string } | null)?.refreshToken;
    const refreshClaims = decodeJwt<{ sub?: string; type?: string }>(refreshToken);
    const user =
      refreshClaims?.type === 'refresh'
        ? mockUserAccounts.find((account) => account.id === refreshClaims.sub)
        : undefined;

    if (!user) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              code: 'INVALID_REFRESH_TOKEN',
              message: 'The refresh token is invalid or expired.',
              timestamp: new Date().toISOString(),
            },
          })
      ).pipe(delay(150));
    }

    setMockBackendTokenExpired(false);
    const accessToken = createJwt(
      {
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        department: user.department,
        assignedMerchantIds: user.assignedMerchantIds,
      },
      3600
    );
    const nextRefreshToken = createJwt({ sub: user.id, type: 'refresh' }, 86400);

    return of(
      new HttpResponse({
        status: 200,
        body: {
          accessToken,
          refreshToken: nextRefreshToken,
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      })
    ).pipe(delay(150));
  }

  if (req.url === '/auth/logout' && req.method === 'POST') {
    return of(
      new HttpResponse({
        status: 200,
        body: { success: true, message: 'Logged out successfully' },
      })
    ).pipe(delay(100));
  }

  return null;
}
