import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenRefreshCoordinator } from '../services/token-refresh-coordinator.service';

/** Adds the current access token and delegates 401 recovery to the refresh coordinator. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const coordinator = inject(TokenRefreshCoordinator);

  // Skip attaching token for refresh endpoint or public endpoints
  if (req.url.includes('/auth/refresh') || req.url.includes('/auth/login')) {
    return next(req);
  }

  const token = authService.accessToken();
  let authReq = req;

  if (token) {
    authReq = coordinator.attachBearer(req, token);
  }

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        return coordinator.handle401Error(authReq, next);
      }
      return throwError(() => err);
    })
  );
};
