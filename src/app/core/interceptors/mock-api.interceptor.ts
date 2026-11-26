import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import { handleMockApplicationRequest } from './mock-application.handlers';
import { handleMockAuthRequest } from './mock-auth.handlers';
import { mockApiState, setMockBackendTokenExpired } from './mock-api-state';
import { isTokenExpired } from '../utils/jwt.util';

export {
  getMockApplicationsCount,
  resetMockBackendState,
  setMockBackendTokenExpired,
} from './mock-api-state';

/** Handles mock API requests in development while passing other requests through. */
export const mockApiInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const { url, method } = req;

  if (!url.startsWith('/api') && !url.startsWith('/auth')) {
    return next(req);
  }

  const authResponse = handleMockAuthRequest(req);
  if (authResponse) {
    return authResponse;
  }

  if (url === '/api/test/expire-token' && method === 'POST') {
    setMockBackendTokenExpired(true);
    return of(new HttpResponse({ status: 200, body: { success: true, message: 'Mock token expired' } }));
  }

  const authHeader = req.headers.get('Authorization');
  const rawToken = authHeader?.replace(/^Bearer\s+/i, '').trim() || '';
  const isExpired =
    mockApiState.tokenExpired ||
    rawToken === 'EXPIRED_TOKEN' ||
    !rawToken ||
    (rawToken.includes('.') && isTokenExpired(rawToken));

  if (url.startsWith('/api') && isExpired) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          url: req.url,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Access token has expired. Re-authentication or refresh required.',
            timestamp: new Date().toISOString(),
          },
        })
    ).pipe(delay(100));
  }

  return handleMockApplicationRequest(req) ?? next(req);
};
