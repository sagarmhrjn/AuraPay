import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, afterEach, expect, it } from 'vitest';
import { AuthService } from './auth.service';
import { AuditService } from './audit.service';
import { MerchantApplication } from '../models/application.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockApp: MerchantApplication = {
    id: 'APP-2026-1001',
    createdAt: '',
    updatedAt: '',
    status: 'UNDER_REVIEW',
    salesRepId: 'usr-sales-01',
    salesRepName: 'Aayush Shrestha',
    businessProfile: {} as any,
    principalProfile: {} as any,
    processingProfile: {} as any,
    complianceRisk: {} as any,
    riskAssessment: { riskScore: 20, riskTier: 'LOW', decisionHistory: [] } as any,
  };

  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // Ignore in non-browser env
    }

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        AuditService,
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    try {
      localStorage.clear();
    } catch {
      // Ignore
    }
  });

  it('should initialize unauthenticated when no stored session exists', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.userRole()).toBeNull();
  });

  it('should log in successfully with valid credentials and store JWT tokens', () => {
    service
      .login({ email: 'aayush.shrestha@aurapay.np', password: 'Password123!' })
      .subscribe((res) => {
        expect(res.user.name).toBe('Aayush Shrestha');
        expect(res.tokens.accessToken).toBe('mock-jwt-token');
        expect(service.isAuthenticated()).toBe(true);
        expect(service.currentUser()?.id).toBe('usr-sales-01');
      });

    const req = httpMock.expectOne('/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({
      user: {
        id: 'usr-sales-01',
        name: 'Aayush Shrestha',
        email: 'aayush.shrestha@aurapay.np',
        role: 'SALES',
        title: 'Senior Merchant Acquisition Officer',
        department: 'Commercial Partnerships (Nepal)',
      },
      tokens: {
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    });
  });

  it('should clear tokens and active session context on logout', () => {
    service.switchUserRole('SALES');
    expect(service.isAuthenticated()).toBe(true);

    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.accessToken()).toBeNull();
  });

  it('should enforce role permissions for SALES role', () => {
    service.switchUserRole('SALES');
    expect(service.hasPermission('CAN_CREATE_APPLICATION')).toBe(true);
    expect(service.hasPermission('CAN_EDIT_APPLICATION')).toBe(true);
    expect(service.hasPermission('CAN_VIEW_OWN_APPLICATIONS')).toBe(true);
    expect(service.hasPermission('CAN_RECORD_RISK_DECISION')).toBe(false);
    expect(service.hasPermission('CAN_REVEAL_SENSITIVE_DATA')).toBe(false);
    expect(service.hasPermission('CAN_MANAGE_ASSIGNMENTS')).toBe(false);
  });

  it('should enforce role permissions for REVIEWER role', () => {
    service.switchUserRole('REVIEWER');
    expect(service.hasPermission('CAN_RECORD_RISK_DECISION')).toBe(true);
    expect(service.hasPermission('CAN_REVEAL_SENSITIVE_DATA')).toBe(true);
    expect(service.hasPermission('CAN_VIEW_ASSIGNED_APPLICATIONS')).toBe(true);
    expect(service.hasPermission('CAN_VIEW_ALL_APPLICATIONS')).toBe(false);
    expect(service.hasPermission('CAN_CREATE_APPLICATION')).toBe(false);
    expect(service.hasPermission('CAN_MANAGE_ASSIGNMENTS')).toBe(false);
  });

  it('should enforce role permissions for ADMIN role', () => {
    service.switchUserRole('ADMIN');
    expect(service.hasPermission('CAN_CREATE_APPLICATION')).toBe(true);
    expect(service.hasPermission('CAN_RECORD_RISK_DECISION')).toBe(true);
    expect(service.hasPermission('CAN_REVEAL_SENSITIVE_DATA')).toBe(true);
    expect(service.hasPermission('CAN_MANAGE_ASSIGNMENTS')).toBe(true);
  });

  it('should evaluate canAccessApplication based on role and ownership', () => {
    service.switchUserRole('SALES');
    // Own application
    expect(service.canAccessApplication(mockApp)).toBe(true);

    // Other sales rep unpermitted application
    const otherApp = { ...mockApp, id: 'APP-2026-9999', salesRepId: 'usr-sales-99' };
    expect(service.canAccessApplication(otherApp)).toBe(false);

    // Reviewers can only access applications assigned to them.
    service.switchUserRole('REVIEWER');
    expect(service.canAccessApplication(otherApp)).toBe(false);
    expect(
      service.canAccessApplication({ ...otherApp, assignedReviewerId: 'usr-rev-01' })
    ).toBe(true);

    // Admin can access any application.
    service.switchUserRole('ADMIN');
    expect(service.canAccessApplication(otherApp)).toBe(true);
  });

  it('should allow sales users to edit accessible drafts and action-required applications only', () => {
    service.switchUserRole('SALES');
    const ownDraft = { ...mockApp, status: 'DRAFT' as const };
    const ownInfoRequested = { ...mockApp, status: 'INFO_REQUESTED' as const };
    const ownUnderReview = { ...mockApp, status: 'UNDER_REVIEW' as const };
    const ownApproved = { ...mockApp, status: 'APPROVED' as const };
    const ownSubmitted = { ...mockApp, status: 'SUBMITTED' as const };
    const ownRejected = { ...mockApp, status: 'REJECTED' as const };
    const assignedDraft = {
      ...ownDraft,
      id: 'APP-2026-1002',
      salesRepId: 'usr-sales-99',
    };
    const otherDraft = {
      ...ownDraft,
      id: 'APP-2026-9999',
      salesRepId: 'usr-sales-99',
    };

    expect(service.canEditApplication(ownDraft)).toBe(true);
    expect(service.canEditApplication(ownInfoRequested)).toBe(true);
    expect(service.canEditApplication(ownUnderReview)).toBe(false);
    expect(service.canEditApplication(ownSubmitted)).toBe(false);
    expect(service.canEditApplication(ownApproved)).toBe(false);
    expect(service.canEditApplication(ownRejected)).toBe(false);
    expect(service.canEditApplication(assignedDraft)).toBe(true);
    expect(service.canEditApplication(otherDraft)).toBe(false);

    service.switchUserRole('ADMIN');
    expect(service.canEditApplication(ownApproved)).toBe(true);
  });

  it('should call POST /auth/refresh and update access token', () => {
    service.refreshToken().subscribe((res) => {
      expect(res.accessToken).toBe('mock-fresh-token-123');
      expect(service.accessToken()).toBe('mock-fresh-token-123');
    });

    const req = httpMock.expectOne('/auth/refresh');
    expect(req.request.method).toBe('POST');
    req.flush({
      accessToken: 'mock-fresh-token-123',
      refreshToken: 'mock-fresh-refresh-456',
      expiresIn: 3600,
    });
  });
});
