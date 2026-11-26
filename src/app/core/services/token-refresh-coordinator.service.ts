import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AuditService } from './audit.service';

/**
 * Service managing concurrent token refresh state across asynchronous HTTP requests
 */
@Injectable({
  providedIn: 'root',
})
export class TokenRefreshCoordinator {
  private isRefreshing = false;
  private readonly refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private auditService: AuditService
  ) {}

  /** Reports whether a token refresh request is currently active. */
  get isRefreshInProgress(): boolean {
    return this.isRefreshing;
  }

  /** Refreshes the token once for concurrent 401 responses and retries queued requests. */
  handle401Error(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    // If request was already the refresh endpoint itself, do not retry to prevent loops
    if (req.url.includes('/auth/refresh')) {
      this.isRefreshing = false;
      this.authService.logout();
      return throwError(() => new Error('Refresh token expired or invalid'));
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const user = this.authService.currentUser();
      this.auditService.log({
        userId: user?.id ?? 'anonymous',
        userName: user?.name ?? 'System',
        userRole: user?.role ?? 'UNKNOWN',
        action: 'TOKEN_REFRESH_CONCURRENT',
        details: `401 Unauthorized caught on [${req.method} ${req.url}]. Initiating single /auth/refresh mutex flow.`,
      });

      return this.authService.refreshToken().pipe(
        switchMap((res) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(res.accessToken);
          // Retry the original request with the newly obtained access token
          return next(this.attachBearer(req, res.accessToken));
        }),
        catchError((refreshErr) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);
          this.authService.logout();
          return throwError(() => refreshErr);
        })
      );
    } else {
      // Refresh is already in flight. Queue concurrent request until new token is emitted
      return this.refreshTokenSubject.pipe(
        filter((token): token is string => token !== null),
        take(1),
        switchMap((freshToken) => next(this.attachBearer(req, freshToken)))
      );
    }
  }

  /** Clones a request with the supplied bearer token. */
  attachBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Reset state for test isolation
  reset(): void {
    this.isRefreshing = false;
    this.refreshTokenSubject.next(null);
  }
}
