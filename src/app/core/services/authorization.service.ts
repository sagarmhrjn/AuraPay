import { Injectable, computed, inject } from '@angular/core';
import { Permission, ROLE_PERMISSIONS, UserRole } from '../constants/auth.const';
import { MerchantApplication } from '../models/application.model';
import { AuthSessionService } from './auth-session.service';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationService {
  private readonly session = inject(AuthSessionService);

  readonly userRole = computed<UserRole | null>(() => this.session.currentUser()?.role ?? null);
  readonly permissions = computed<Permission[]>(() => {
    const user = this.session.currentUser();
    return user ? ROLE_PERMISSIONS[user.role] ?? [] : [];
  });

  /** Checks whether the active user's role grants the requested permission. */
  hasPermission(permission: Permission): boolean {
    return this.permissions().includes(permission);
  }

  /** Checks whether the active user has one of the specified roles. */
  hasRole(roles: UserRole[]): boolean {
    const role = this.userRole();
    return role ? roles.includes(role) : false;
  }

  /** Determines whether the active user may view a particular application. */
  canAccessApplication(application: MerchantApplication): boolean {
    const user = this.session.currentUser();
    if (!user || !user.role) return false;

    switch (user.role) {
      case 'ADMIN':
        return true;
      case 'REVIEWER':
        return application.assignedReviewerId === user.id;
      case 'SALES':
        return (
          application.salesRepId === user.id ||
          (user.assignedMerchantIds?.includes(application.id) ?? false)
        );
      default:
        return false;
    }
  }

  /** Determines whether the active user may edit a particular application. */
  canEditApplication(application: MerchantApplication): boolean {
    const user = this.session.currentUser();
    if (!user || !this.hasPermission('CAN_EDIT_APPLICATION') || !this.canAccessApplication(application)) {
      return false;
    }

    return (
      user.role !== 'SALES' ||
      application.status === 'DRAFT' ||
      application.status === 'INFO_REQUESTED'
    );
  }
}
