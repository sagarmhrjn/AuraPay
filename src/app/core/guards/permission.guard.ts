import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Permission, UserRole } from '../constants/auth.const';

/** Creates a route guard that requires a specific permission. */
export const permissionGuard = (requiredPermission: Permission): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);

    if (authService.hasPermission(requiredPermission)) {
      return true;
    }

    toast.warning(
      'Access Restricted',
      `Your current role (${authService.userRole()}) lacks the required permission: ${requiredPermission}`
    );

    return router.createUrlTree(['/unauthorized'], {
      queryParams: {
        reason: 'PERMISSION_DENIED',
        permission: requiredPermission,
        role: authService.userRole(),
      },
    });
  };
};

/** Creates a route guard that limits access to the specified user roles. */
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);

    if (authService.hasRole(allowedRoles)) {
      return true;
    }

    toast.warning(
      'Unauthorized Role',
      `This route is restricted to [${allowedRoles.join(', ')}]. You are currently logged in as ${authService.userRole()}.`
    );

    return router.createUrlTree(['/unauthorized'], {
      queryParams: {
        reason: 'ROLE_DENIED',
        role: authService.userRole(),
        allowed: allowedRoles.join(','),
      },
    });
  };
};
