import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { TokenRefreshCoordinator } from '../services/token-refresh-coordinator.service';
import { AuthService } from '../services/auth.service';
import { AuditService } from '../services/audit.service';

describe('AuthInterceptor & TokenRefreshCoordinator', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let coordinator: TokenRefreshCoordinator;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        AuditService,
        TokenRefreshCoordinator,
        provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    coordinator = TestBed.inject(TokenRefreshCoordinator);

    authService.setRawAccessToken('initial-access-token');
    coordinator.reset();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach Bearer token to protected outgoing requests', () => {
    http.get('/api/test-resource').subscribe();

    const req = httpMock.expectOne('/api/test-resource');
    expect(req.request.headers.get('Authorization')).toBe('Bearer initial-access-token');
    req.flush({ success: true });
  });

  it('should NOT attach Bearer token to /auth/refresh', () => {
    http.post('/auth/refresh', { refreshToken: 'dummy' }).subscribe();

    const req = httpMock.expectOne('/auth/refresh');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ accessToken: 'new-token' });
  });

  it('should refresh token on single 401 and retry request with new token', () => {
    let finalResponse: any = null;

    http.get('/api/secure-data').subscribe((data) => {
      finalResponse = data;
    });

    // Initial request fails with 401
    const req1 = httpMock.expectOne('/api/secure-data');
    expect(req1.request.headers.get('Authorization')).toBe('Bearer initial-access-token');
    req1.flush({ message: 'Token Expired' }, { status: 401, statusText: 'Unauthorized' });

    // Expect single POST /auth/refresh call
    const refreshReq = httpMock.expectOne('/auth/refresh');
    expect(refreshReq.request.method).toBe('POST');
    refreshReq.flush({
      accessToken: 'refreshed-access-token-002',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600,
    });

    // Expect original request to be retried with the refreshed token
    const retryReq = httpMock.expectOne('/api/secure-data');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer refreshed-access-token-002');
    retryReq.flush({ data: 'secret merchant payload' });

    expect(finalResponse).toEqual({ data: 'secret merchant payload' });
  });

  it('should handle multiple concurrent 401s with exactly ONE /auth/refresh call and retry all requests', () => {
    let res1: any = null;
    let res2: any = null;
    let res3: any = null;

    // Fire 3 simultaneous concurrent HTTP requests
    http.get('/api/resource-1').subscribe((val) => (res1 = val));
    http.get('/api/resource-2').subscribe((val) => (res2 = val));
    http.get('/api/resource-3').subscribe((val) => (res3 = val));

    // All 3 initial requests are emitted with initial token
    const initialReq1 = httpMock.expectOne('/api/resource-1');
    const initialReq2 = httpMock.expectOne('/api/resource-2');
    const initialReq3 = httpMock.expectOne('/api/resource-3');

    // All 3 requests return 401 Unauthorized
    initialReq1.flush({ error: '401' }, { status: 401, statusText: 'Unauthorized' });
    initialReq2.flush({ error: '401' }, { status: 401, statusText: 'Unauthorized' });
    initialReq3.flush({ error: '401' }, { status: 401, statusText: 'Unauthorized' });

    // CRITICAL: Exactly ONE refresh call must be dispatched!
    const refreshReqs = httpMock.match('/auth/refresh');
    expect(refreshReqs.length).toBe(1);

    // Resolve the refresh call
    refreshReqs[0].flush({
      accessToken: 'mutex-refreshed-token-999',
      refreshToken: 'new-refresh-999',
      expiresIn: 3600,
    });

    // All 3 requests must now be retried with the newly emitted token
    const retriedReq1 = httpMock.expectOne('/api/resource-1');
    const retriedReq2 = httpMock.expectOne('/api/resource-2');
    const retriedReq3 = httpMock.expectOne('/api/resource-3');

    expect(retriedReq1.request.headers.get('Authorization')).toBe('Bearer mutex-refreshed-token-999');
    expect(retriedReq2.request.headers.get('Authorization')).toBe('Bearer mutex-refreshed-token-999');
    expect(retriedReq3.request.headers.get('Authorization')).toBe('Bearer mutex-refreshed-token-999');

    retriedReq1.flush({ id: 1, name: 'resource 1' });
    retriedReq2.flush({ id: 2, name: 'resource 2' });
    retriedReq3.flush({ id: 3, name: 'resource 3' });

    // Verify all 3 observers received their expected responses
    expect(res1).toEqual({ id: 1, name: 'resource 1' });
    expect(res2).toEqual({ id: 2, name: 'resource 2' });
    expect(res3).toEqual({ id: 3, name: 'resource 3' });
  });

  it('should logout and reject requests if /auth/refresh fails', () => {
    let errorReceived: any = null;
    const logoutSpy = vi.spyOn(authService, 'logout');

    http.get('/api/sensitive').subscribe({
      next: () => {},
      error: (err) => (errorReceived = err),
    });

    const initialReq = httpMock.expectOne('/api/sensitive');
    initialReq.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    const refreshReq = httpMock.expectOne('/auth/refresh');
    refreshReq.flush({ error: 'Refresh token expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(logoutSpy).toHaveBeenCalled();
    expect(errorReceived).toBeTruthy();
  });
});
