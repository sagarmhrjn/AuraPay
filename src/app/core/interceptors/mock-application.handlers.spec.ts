import { HttpHeaders, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApplicationStatus } from '../constants/application.const';
import { MerchantApplication, PaginatedApplicationsResponse } from '../models/application.model';
import { INITIAL_MOCK_APPLICATIONS } from '../services/mock-data';
import { createJwt } from '../utils/jwt.util';
import { mockApiState, resetMockBackendState } from './mock-api-state';
import { handleMockApplicationRequest } from './mock-application.handlers';

describe('mock application handlers: SALES access', () => {
  const salesUserId = 'usr-sales-test';
  const assignedApplicationId = 'APP-ASSIGNED';
  const salesToken = createJwt({
    sub: salesUserId,
    role: 'SALES',
    assignedMerchantIds: [assignedApplicationId],
  });
  const reviewerUserId = 'usr-reviewer-test';
  const reviewerToken = createJwt({ sub: reviewerUserId, role: 'REVIEWER' });
  const sampleApplication = INITIAL_MOCK_APPLICATIONS[0];

  beforeEach(() => {
    resetMockBackendState();
  });

  function makeApplication(
    id: string,
    salesRepId: string,
    status: ApplicationStatus = 'DRAFT'
  ): MerchantApplication {
    return {
      ...sampleApplication,
      id,
      salesRepId,
      status,
      riskAssessment: {
        ...sampleApplication.riskAssessment,
        decisionHistory: [...sampleApplication.riskAssessment.decisionHistory],
      },
    };
  }

  function makeRequest(
    method: string,
    url: string,
    body: unknown = null,
    token = salesToken
  ): HttpRequest<unknown> {
    return new HttpRequest(method, url, body, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      params: new HttpParams().set('page', '1').set('pageSize', '20'),
    });
  }

  it('lists only applications owned by or assigned to the sales user', async () => {
    mockApiState.applications = [
      makeApplication('APP-OWNED', salesUserId),
      makeApplication(assignedApplicationId, 'usr-sales-other'),
      makeApplication('APP-OTHER', 'usr-sales-other'),
    ];

    const response = await firstValueFrom(
      handleMockApplicationRequest(makeRequest('GET', '/api/applications'))!
    );
    const body = (response as HttpResponse<PaginatedApplicationsResponse>).body!;

    expect(body.items.map((application) => application.id)).toEqual([
      'APP-OWNED',
      assignedApplicationId,
    ]);
    expect(body.total).toBe(2);
  });

  it('rejects direct reads of applications outside the sales user access scope', async () => {
    mockApiState.applications = [makeApplication('APP-OTHER', 'usr-sales-other')];

    await expect(
      firstValueFrom(handleMockApplicationRequest(makeRequest('GET', '/api/applications/APP-OTHER'))!)
    ).rejects.toMatchObject({ status: 403 });
  });

  it('allows the sales user to create their own draft', async () => {
    mockApiState.applications = [];
    const draft = {
      salesRepId: salesUserId,
      salesRepName: 'Sales User',
      status: 'DRAFT' as const,
      businessProfile: sampleApplication.businessProfile,
      principalProfile: sampleApplication.principalProfile,
      processingProfile: sampleApplication.processingProfile,
      complianceRisk: sampleApplication.complianceRisk,
      riskAssessment: sampleApplication.riskAssessment,
    };

    const response = await firstValueFrom(
      handleMockApplicationRequest(makeRequest('POST', '/api/applications/draft', draft))!
    );

    expect((response as HttpResponse<MerchantApplication>).status).toBe(200);
    expect(mockApiState.applications).toHaveLength(1);
    expect(mockApiState.applications[0].salesRepId).toBe(salesUserId);
  });

  it('rejects editing applications outside the sales user access scope', async () => {
    mockApiState.applications = [makeApplication('APP-OTHER', 'usr-sales-other')];

    await expect(
      firstValueFrom(
        handleMockApplicationRequest(
          makeRequest('POST', '/api/applications/draft', {
            id: 'APP-OTHER',
            salesRepId: salesUserId,
            status: 'DRAFT',
          })
        )!
      )
    ).rejects.toMatchObject({ status: 403 });
  });

  it('allows the sales user to edit an owned action-required application', async () => {
    const requestedInfo = makeApplication('APP-INFO-REQUESTED', salesUserId, 'INFO_REQUESTED');
    mockApiState.applications = [requestedInfo];

    const response = await firstValueFrom(
      handleMockApplicationRequest(
        makeRequest('POST', '/api/applications/draft', {
          id: requestedInfo.id,
          salesRepId: salesUserId,
          status: 'INFO_REQUESTED',
        })
      )!
    );

    expect((response as HttpResponse<MerchantApplication>).status).toBe(200);
    expect(requestedInfo.status).toBe('INFO_REQUESTED');
  });

  it('rejects SALES edits to owned applications outside DRAFT and INFO_REQUESTED', async () => {
    const approvedApplication = makeApplication('APP-APPROVED', salesUserId, 'APPROVED');
    mockApiState.applications = [approvedApplication];

    await expect(
      firstValueFrom(
        handleMockApplicationRequest(
          makeRequest('POST', '/api/applications/draft', {
            id: approvedApplication.id,
            salesRepId: salesUserId,
            status: 'APPROVED',
          })
        )!
      )
    ).rejects.toMatchObject({ status: 403 });
    expect(approvedApplication.status).toBe('APPROVED');
  });

  it('lists only applications assigned to the reviewer', async () => {
    mockApiState.applications = [
      { ...makeApplication('APP-REVIEWER-ASSIGNED', 'usr-sales-01'), assignedReviewerId: reviewerUserId },
      { ...makeApplication('APP-REVIEWER-OTHER', 'usr-sales-01'), assignedReviewerId: 'usr-reviewer-other' },
    ];

    const response = await firstValueFrom(
      handleMockApplicationRequest(
        makeRequest('GET', '/api/applications', null, reviewerToken)
      )!
    );
    const body = (response as HttpResponse<PaginatedApplicationsResponse>).body!;

    expect(body.items.map((application) => application.id)).toEqual(['APP-REVIEWER-ASSIGNED']);
    expect(body.total).toBe(1);
  });

  it('rejects direct reads and decisions for applications not assigned to the reviewer', async () => {
    mockApiState.applications = [
      { ...makeApplication('APP-REVIEWER-OTHER', 'usr-sales-01'), assignedReviewerId: 'usr-reviewer-other' },
    ];

    await expect(
      firstValueFrom(
        handleMockApplicationRequest(
          makeRequest('GET', '/api/applications/APP-REVIEWER-OTHER', null, reviewerToken)
        )!
      )
    ).rejects.toMatchObject({ status: 403 });

    await expect(
      firstValueFrom(
        handleMockApplicationRequest(
          makeRequest(
            'PUT',
            '/api/applications/APP-REVIEWER-OTHER/decision',
            { action: 'APPROVE', note: 'Approved.' },
            reviewerToken
          )
        )!
      )
    ).rejects.toMatchObject({ status: 403 });
  });
});
