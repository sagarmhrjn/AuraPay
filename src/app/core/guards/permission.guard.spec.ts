import { TestBed } from '@angular/core/testing';
import { UrlTree } from '@angular/router';
import { describe, beforeEach, expect, it } from 'vitest';
import { authGuard } from './auth.guard';
import { permissionGuard, roleGuard } from './permission.guard';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { provideHttpClient, withXhr } from '@angular/common/http';

describe('Route Guards', () => {
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, ToastService, provideHttpClient(withXhr())],
    });

    authService = TestBed.inject(AuthService);
  });

  describe('authGuard', () => {
    it('should allow access if user is authenticated', () => {
      authService.setRawAccessToken('valid-token');
      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('should redirect to /login if user is logged out', () => {
      authService.logout();
      const result = TestBed.runInInjectionContext(() => authGuard({} as any, { url: '/applications' } as any));
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toContain('/login');
    });
  });

  describe('permissionGuard', () => {
    it('should allow access if active user has permission', () => {
      authService.switchUserRole('SALES');
      const guard = permissionGuard('CAN_CREATE_APPLICATION');
      const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('should allow SALES users to access the edit route', () => {
      authService.switchUserRole('SALES');
      const guard = permissionGuard('CAN_EDIT_APPLICATION');
      const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('should block access and return UrlTree if user lacks permission', () => {
      authService.switchUserRole('SALES');
      // SALES lacks CAN_RECORD_RISK_DECISION
      const guard = permissionGuard('CAN_RECORD_RISK_DECISION');
      const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toContain('/unauthorized');
    });
  });

  describe('roleGuard', () => {
    it('should allow access when user role matches', () => {
      authService.switchUserRole('REVIEWER');
      const guard = roleGuard(['REVIEWER', 'ADMIN']);
      const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('should deny access when user role does not match', () => {
      authService.switchUserRole('SALES');
      const guard = roleGuard(['REVIEWER', 'ADMIN']);
      const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
      expect(result).toBeInstanceOf(UrlTree);
      expect((result as UrlTree).toString()).toContain('/unauthorized');
    });
  });
});
