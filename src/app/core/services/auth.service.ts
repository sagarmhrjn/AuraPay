import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { MerchantApplication } from '../models/application.model';
import { AuditService } from './audit.service';
import { AuthSessionService } from './auth-session.service';
import { AuthorizationService } from './authorization.service';
import { DemoAuthService } from './demo-auth.service';
import { UserRole, Permission } from '../constants/auth.const';
import { LoginCredentials, AuthResponse, RefreshTokenResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly auditService = inject(AuditService);
  private readonly session = inject(AuthSessionService);
  private readonly authorization = inject(AuthorizationService);
  private readonly demoAuth = inject(DemoAuthService);

  readonly currentUser = this.session.currentUser;
  readonly accessToken = this.session.accessToken;
  readonly refreshTokenValue = this.session.refreshTokenValue;
  readonly isAuthenticated = this.session.isAuthenticated;
  readonly userRole = this.authorization.userRole;
  readonly permissions = this.authorization.permissions;

  /**
   * Performs authentication against POST /auth/login and starts a session.
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/auth/login', credentials).pipe(
      tap((res) => {
        const persistSession = credentials.rememberMe !== false;
        this.session.establishSession(
          res.user,
          res.tokens.accessToken,
          res.tokens.refreshToken,
          persistSession
        );

        this.auditService.log({
          userId: res.user.id,
          userName: res.user.name,
          userRole: res.user.role,
          action: 'LOGIN_SUCCESS',
          details: `User ${res.user.name} logged in with role ${res.user.role} via JWT authentication`,
        });
      })
    );
  }

  /** Clears the current session and records the logout event. */
  logout(): void {
    const previousUser = this.session.currentUser();
    this.session.clearSession();

    if (previousUser) {
      this.auditService.log({
        userId: previousUser.id,
        userName: previousUser.name,
        userRole: previousUser.role,
        action: 'LOGOUT',
        details: `User ${previousUser.name} logged out from portal session`,
      });
    }
  }

  /**
   * Refreshes the bearer token against POST /auth/refresh.
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const currentRefresh = this.session.refreshTokenValue() || 'mock-jwt-refresh-token-default';
    return this.http
      .post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken: currentRefresh,
      })
      .pipe(
        tap((res) => {
          this.session.setTokens(res.accessToken, res.refreshToken, true);

          const user = this.session.currentUser();
          this.auditService.log({
            userId: user?.id ?? 'anonymous',
            userName: user?.name ?? 'System',
            userRole: user?.role ?? 'UNKNOWN',
            action: 'TOKEN_REFRESH_SUCCESS',
            details: `Successfully refreshed access token (expires in ${res.expiresIn}s)`,
          });
        })
      );
  }

  /** Delegates permission checks to the authorization feature. */
  hasPermission(permission: Permission): boolean {
    return this.authorization.hasPermission(permission);
  }

  /** Delegates role checks to the authorization feature. */
  hasRole(roles: UserRole[]): boolean {
    return this.authorization.hasRole(roles);
  }

  /** Delegates application access checks to the authorization feature. */
  canAccessApplication(application: MerchantApplication): boolean {
    return this.authorization.canAccessApplication(application);
  }

  /** Delegates application edit checks to the authorization feature. */
  canEditApplication(application: MerchantApplication): boolean {
    return this.authorization.canEditApplication(application);
  }

  /** Forwards demo persona changes to the demo authentication feature. */
  switchUserRole(role: UserRole): void {
    this.demoAuth.switchUserRole(role);
  }

  /** Replaces the active access token for the security demo. */
  expireAccessTokenForTesting(): void {
    this.demoAuth.expireAccessToken();
  }

  /** Replaces the access token directly, primarily for authentication tests. */
  setRawAccessToken(token: string | null): void {
    this.demoAuth.setRawAccessTokenForTesting(token);
  }
}
