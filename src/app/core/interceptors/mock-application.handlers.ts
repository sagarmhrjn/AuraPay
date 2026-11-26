import {
  HttpErrorResponse,
  HttpEvent,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import { ApplicationStatus } from '../constants/application.const';
import { UserRole } from '../constants/auth.const';
import {
  DashboardStatusCounts,
  MerchantApplication,
  PaginatedApplicationsResponse,
  RiskDecisionPayload,
} from '../models/application.model';
import { decodeJwt } from '../utils/jwt.util';
import { mockApiState } from './mock-api-state';

interface MockUserClaims {
  sub: string;
  role: UserRole;
  assignedMerchantIds?: string[];
}

function getMockUser(req: HttpRequest<unknown>): MockUserClaims | null {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
  return decodeJwt<MockUserClaims>(token);
}

function salesUserCanAccess(application: MerchantApplication, user: MockUserClaims): boolean {
  return (
    application.salesRepId === user.sub ||
    (user.assignedMerchantIds?.includes(application.id) ?? false)
  );
}

function reviewerUserCanAccess(application: MerchantApplication, user: MockUserClaims): boolean {
  return application.assignedReviewerId === user.sub;
}

function salesUserCanEdit(application: MerchantApplication, user: MockUserClaims): boolean {
  return (
    salesUserCanAccess(application, user) &&
    (application.status === 'DRAFT' || application.status === 'INFO_REQUESTED')
  );
}

function forbiddenResponse(message: string): Observable<HttpEvent<unknown>> {
  return throwError(
    () =>
      new HttpErrorResponse({
        status: 403,
        statusText: 'Forbidden',
        error: message,
      })
  );
}

/** Handles mock application read and write endpoints. */
export function handleMockApplicationRequest(
  req: HttpRequest<unknown>
): Observable<HttpEvent<unknown>> | null {
  const { url, method } = req;
  const mockApplications = mockApiState.applications;
  const requestUser = getMockUser(req);
  const salesUser = requestUser?.role === 'SALES' ? requestUser : null;
  const reviewerUser = requestUser?.role === 'REVIEWER' ? requestUser : null;
  const visibleApplications = salesUser
    ? mockApplications.filter((app) => salesUserCanAccess(app, salesUser))
    : reviewerUser
      ? mockApplications.filter((app) => reviewerUserCanAccess(app, reviewerUser))
      : mockApplications;

  if (url === '/api/applications/stats' && method === 'GET') {
    const counts: DashboardStatusCounts = {
      total: visibleApplications.length,
      draft: visibleApplications.filter((app) => app.status === 'DRAFT').length,
      submitted: visibleApplications.filter((app) => app.status === 'SUBMITTED').length,
      underReview: visibleApplications.filter((app) => app.status === 'UNDER_REVIEW').length,
      infoRequested: visibleApplications.filter((app) => app.status === 'INFO_REQUESTED').length,
      approved: visibleApplications.filter((app) => app.status === 'APPROVED').length,
      rejected: visibleApplications.filter((app) => app.status === 'REJECTED').length,
    };
    return of(new HttpResponse({ status: 200, body: counts })).pipe(delay(150));
  }

  if (url.startsWith('/api/applications') && method === 'GET') {
    const pathParts = url.split('/').filter(Boolean);

    if (pathParts.length === 3 && pathParts[1] === 'applications' && pathParts[2] !== 'stats') {
      const id = pathParts[2];
      const found = mockApplications.find((app) => app.id.toLowerCase() === id.toLowerCase());
      if (found) {
        if (
          (salesUser && !salesUserCanAccess(found, salesUser)) ||
          (reviewerUser && !reviewerUserCanAccess(found, reviewerUser))
        ) {
          return forbiddenResponse('You do not have permission to view this application.');
        }
        return of(new HttpResponse({ status: 200, body: found })).pipe(delay(150));
      }
      return throwError(
        () => new HttpErrorResponse({ status: 404, statusText: 'Not Found', error: 'Application not found' })
      );
    }

    const fullUrl = req.urlWithParams || url;
    const urlObj = new URL(fullUrl, 'http://localhost');
    const getParam = (key: string): string => req.params.get(key) ?? urlObj.searchParams.get(key) ?? '';

    const page = parseInt(getParam('page') || '1', 10);
    const pageSize = parseInt(getParam('pageSize') || '10', 10);
    const searchTerm = getParam('searchTerm').toLowerCase().trim();
    const status = getParam('status') || 'ALL';
    const riskTier = getParam('riskTier') || 'ALL';
    const salesRepId = getParam('salesRepId');
    const assignedReviewerId = getParam('assignedReviewerId');

    let filtered = [...visibleApplications];

    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.id.toLowerCase().includes(searchTerm) ||
          app.businessProfile.legalName.toLowerCase().includes(searchTerm) ||
          (app.businessProfile.dbaName?.toLowerCase().includes(searchTerm) ?? false) ||
          (app.businessProfile.pan?.toLowerCase().includes(searchTerm) ?? false) ||
          (app.businessProfile.ein?.toLowerCase().includes(searchTerm) ?? false) ||
          app.principalProfile.fullName.toLowerCase().includes(searchTerm) ||
          app.salesRepName.toLowerCase().includes(searchTerm) ||
          (app.assignedReviewerName?.toLowerCase().includes(searchTerm) ?? false)
      );
    }

    if (status && status !== 'ALL') {
      filtered = filtered.filter((app) => app.status === status);
    }
    if (riskTier && riskTier !== 'ALL') {
      filtered = filtered.filter((app) => app.riskAssessment.riskTier === riskTier);
    }
    if (salesRepId) {
      filtered = filtered.filter((app) => app.salesRepId === salesRepId);
    }
    if (assignedReviewerId) {
      filtered = filtered.filter((app) => app.assignedReviewerId === assignedReviewerId);
    }

    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const total = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);
    const responseBody: PaginatedApplicationsResponse = {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };

    return of(new HttpResponse({ status: 200, body: responseBody })).pipe(delay(180));
  }

  if (url === '/api/applications/draft' && method === 'POST') {
    const draftData = req.body as Partial<MerchantApplication>;
    let target = mockApplications.find((app) => app.id.toLowerCase() === (draftData.id || '').toLowerCase());

    if (
      salesUser &&
      (target
        ? !salesUserCanEdit(target, salesUser)
        : draftData.salesRepId !== salesUser.sub)
    ) {
      return forbiddenResponse('You do not have permission to edit this application.');
    }

    if (target) {
      Object.assign(target, draftData, { updatedAt: new Date().toISOString() });
    } else {
      const timestamp = new Date().toISOString();
      const newId = draftData.id || `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      target = {
        ...(draftData as MerchantApplication),
        id: newId,
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'DRAFT',
      };
      mockApplications.unshift(target);
    }

    return of(new HttpResponse({ status: 200, body: target })).pipe(delay(200));
  }

  if (url === '/api/applications' && method === 'POST') {
    const appData = req.body as MerchantApplication;
    let target = mockApplications.find((app) => app.id === appData.id);
    const timestamp = new Date().toISOString();

    if (
      salesUser &&
      (appData.salesRepId !== salesUser.sub ||
        (target ? !salesUserCanEdit(target, salesUser) : false))
    ) {
      return forbiddenResponse('You do not have permission to submit this application.');
    }

    if (target) {
      const previousStatus = target.status;
      Object.assign(target, appData, {
        status: 'SUBMITTED',
        submittedAt: timestamp,
        updatedAt: timestamp,
      });
      target.riskAssessment.decisionHistory.push({
        id: `log-${Date.now()}`,
        timestamp,
        actorId: appData.salesRepId,
        actorName: appData.salesRepName,
        actorRole: 'SALES',
        action: 'SUBMITTED',
        previousStatus,
        newStatus: 'SUBMITTED',
        note: 'Submitted application for formal underwriting review.',
      });
    } else {
      target = {
        ...appData,
        id: appData.id || `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: timestamp,
        updatedAt: timestamp,
        submittedAt: timestamp,
        status: 'SUBMITTED',
      };
      mockApplications.unshift(target);
    }

    return of(new HttpResponse({ status: 201, body: target })).pipe(delay(250));
  }

  if (url.includes('/decision') && method === 'PUT') {
    const parts = url.split('/');
    const id = parts[3];
    const target = mockApplications.find((app) => app.id === id);

    if (!target) {
      return throwError(() => new HttpErrorResponse({ status: 404, error: 'Application not found' }));
    }

    if (reviewerUser && !reviewerUserCanAccess(target, reviewerUser)) {
      return forbiddenResponse('You do not have permission to record a decision for this application.');
    }

    const payload = req.body as RiskDecisionPayload;
    const previousStatus = target.status;
    let newStatus: ApplicationStatus = target.status;

    if (payload.action === 'APPROVE') {
      newStatus = 'APPROVED';
      if (payload.riskTier) {
        target.riskAssessment.riskTier = payload.riskTier;
      }
    } else if (payload.action === 'REJECT') {
      newStatus = 'REJECTED';
      target.riskAssessment.rejectionReasonCode = payload.rejectionReasonCode || 'RISK_POLICY_EXPOSURE';
    } else if (payload.action === 'REQUEST_INFO') {
      newStatus = 'INFO_REQUESTED';
    }

    target.status = newStatus;
    target.updatedAt = new Date().toISOString();
    target.riskAssessment.reviewerNotes = payload.note;
    target.riskAssessment.decisionHistory.push({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: 'usr-rev-02',
      actorName: 'Jeshan Joshi',
      actorRole: 'REVIEWER',
      action:
        payload.action === 'APPROVE'
          ? 'APPROVED'
          : payload.action === 'REJECT'
            ? 'REJECTED'
            : 'REQUEST_INFO',
      previousStatus,
      newStatus,
      note: payload.note,
      assignedTier: payload.riskTier,
      approvedLimit: payload.approvedLimit,
    });

    return of(new HttpResponse({ status: 200, body: target })).pipe(delay(200));
  }

  if (url.includes('/assign') && method === 'PUT') {
    const parts = url.split('/');
    const id = parts[3];
    const target = mockApplications.find((app) => app.id === id);

    if (!target) {
      return throwError(() => new HttpErrorResponse({ status: 404, error: 'Application not found' }));
    }

    const { reviewerId, reviewerName } = req.body as { reviewerId: string; reviewerName: string };
    const previousStatus = target.status;
    target.assignedReviewerId = reviewerId;
    target.assignedReviewerName = reviewerName;
    if (target.status === 'SUBMITTED') {
      target.status = 'UNDER_REVIEW';
    }
    target.updatedAt = new Date().toISOString();
    target.riskAssessment.decisionHistory.push({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: 'usr-adm-03',
      actorName: 'Alice Chen',
      actorRole: 'ADMIN',
      action: 'ASSIGNED',
      previousStatus,
      newStatus: target.status,
      note: `Application assigned to reviewer ${reviewerName}`,
    });

    return of(new HttpResponse({ status: 200, body: target })).pipe(delay(150));
  }

  return null;
}
