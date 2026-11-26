import { TestBed } from '@angular/core/testing';
import { UrlTree } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { describe, beforeEach, expect, it } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(withXhr())],
    });

    authService = TestBed.inject(AuthService);
  });

  it('should allow navigation if user is authenticated with active JWT', () => {
    authService.setRawAccessToken('mock-valid-jwt');
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/applications' } as any)
    );
    expect(result).toBe(true);
  });

  it('should redirect unauthenticated users to /login with returnUrl parameter', () => {
    authService.logout();
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/applications/APP-2026-1001' } as any)
    );
    expect(result).toBeInstanceOf(UrlTree);
    const urlTree = result as UrlTree;
    expect(urlTree.toString()).toContain('/login');
    expect(urlTree.queryParams['returnUrl']).toBe('/applications/APP-2026-1001');
  });
});
