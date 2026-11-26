import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, afterEach, expect, it } from 'vitest';
import { ApplicationService } from './application.service';

describe('ApplicationService Filtering & Querying', () => {
  let service: ApplicationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApplicationService,
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ApplicationService);
    httpMock = TestBed.inject(HttpTestingController);

    // Initial setup requests in constructor
    const initReq = httpMock.expectOne((req) => req.url === '/api/applications');
    initReq.flush({
      items: [],
      total: 0,
      page: 1,
      pageSize: 5,
      totalPages: 1,
    });

    const statsReq = httpMock.expectOne('/api/applications/stats');
    statsReq.flush({
      total: 4,
      draft: 1,
      submitted: 0,
      underReview: 1,
      infoRequested: 1,
      approved: 1,
      rejected: 0,
    });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should pass status query parameter when filtering by status', () => {
    service.setFilter({ status: 'UNDER_REVIEW' });

    const req = httpMock.expectOne((r) => r.url === '/api/applications');
    expect(req.request.params.get('status')).toBe('UNDER_REVIEW');
    expect(req.request.params.get('page')).toBe('1');

    req.flush({
      items: [{ id: 'APP-2026-1001', status: 'UNDER_REVIEW' } as any],
      total: 1,
      page: 1,
      pageSize: 5,
      totalPages: 1,
    });

    expect(service.applications().length).toBe(1);
    expect(service.applications()[0].status).toBe('UNDER_REVIEW');
  });

  it('should pass searchTerm parameter when searching', () => {
    service.setFilter({ searchTerm: 'Himalayan' });

    const req = httpMock.expectOne((r) => r.url === '/api/applications');
    expect(req.request.params.get('searchTerm')).toBe('Himalayan');

    req.flush({
      items: [{ id: 'APP-2026-1001', businessProfile: { legalName: 'Himalayan Cloud Logistics' } } as any],
      total: 1,
      page: 1,
      pageSize: 5,
      totalPages: 1,
    });

    expect(service.applications().length).toBe(1);
  });

  it('should pass riskTier parameter when filtering by risk tier', () => {
    service.setFilter({ riskTier: 'LOW' });

    const req = httpMock.expectOne((r) => r.url === '/api/applications');
    expect(req.request.params.get('riskTier')).toBe('LOW');

    req.flush({
      items: [],
      total: 0,
      page: 1,
      pageSize: 5,
      totalPages: 0,
    });
  });

  it('should pass salesRepId and assignedReviewerId parameters', () => {
    service.setFilter({ salesRepId: 'usr-sales-01', assignedReviewerId: 'usr-rev-01' });

    const req = httpMock.expectOne((r) => r.url === '/api/applications');
    expect(req.request.params.get('salesRepId')).toBe('usr-sales-01');
    expect(req.request.params.get('assignedReviewerId')).toBe('usr-rev-01');

    req.flush({
      items: [],
      total: 0,
      page: 1,
      pageSize: 5,
      totalPages: 0,
    });
  });

  it('clears cached applications and filters when reloading for another user', () => {
    service.setFilter({
      searchTerm: 'Aayush',
      status: 'APPROVED',
      salesRepId: 'usr-sales-01',
    });
    const oldUserRequest = httpMock.expectOne((req) => req.url === '/api/applications');
    oldUserRequest.flush({
      items: [{ id: 'APP-OLD-USER' } as any],
      total: 1,
      page: 1,
      pageSize: 5,
      totalPages: 1,
    });

    expect(service.applications()[0].id).toBe('APP-OLD-USER');

    service.reloadForUser('usr-sales-02');

    expect(service.applications()).toEqual([]);
    expect(service.totalItems()).toBe(0);
    expect(service.statusCounts().total).toBe(0);

    const newUserRequest = httpMock.expectOne((req) => req.url === '/api/applications');
    expect(newUserRequest.request.params.get('searchTerm')).toBeNull();
    expect(newUserRequest.request.params.get('status')).toBeNull();
    expect(newUserRequest.request.params.get('salesRepId')).toBeNull();
    newUserRequest.flush({
      items: [{ id: 'APP-NEW-USER' } as any],
      total: 1,
      page: 1,
      pageSize: 5,
      totalPages: 1,
    });

    const newUserStatsRequest = httpMock.expectOne('/api/applications/stats');
    newUserStatsRequest.flush({
      total: 1,
      draft: 0,
      submitted: 1,
      underReview: 0,
      infoRequested: 0,
      approved: 0,
      rejected: 0,
    });

    expect(service.applications()[0].id).toBe('APP-NEW-USER');
    expect(service.statusCounts().total).toBe(1);
  });
});
