import { Injectable, inject } from '@angular/core';
import { UserRole } from '../constants/auth.const';
import { AuditService } from './audit.service';
import { AuthSessionService } from './auth-session.service';
import { getDefaultMockUser, MOCK_USERS } from './mock-data';
import { createJwt } from '../utils/jwt.util';

@Injectable({
  providedIn: 'root',
})
export class DemoAuthService {
  private readonly session = inject(AuthSessionService);
  private readonly auditService = inject(AuditService);

  /** Switches to a demo persona and persists its generated session tokens. */
  switchUserRole(role: UserRole): void {
    const user = getDefaultMockUser(role);
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
    const refreshToken = createJwt({ sub: user.id, type: 'refresh' }, 86400);

    this.session.establishSession(user, accessToken, refreshToken, true);
    this.auditService.log({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'ROLE_SWITCH',
      details: `Switched active session context to role ${role} (${user.name})`,
    });
  }

  /** Replaces the active access token for the security demo. */
  expireAccessToken(): void {
    this.session.setAccessToken('EXPIRED_TOKEN');
  }

  /** Seeds a demo user and raw token for authentication tests. */
  setRawAccessTokenForTesting(token: string | null): void {
    if (token && !this.session.currentUser()) {
      this.session.setCurrentUser(MOCK_USERS.SALES[0]);
    }
    this.session.setAccessToken(token);
  }
}
