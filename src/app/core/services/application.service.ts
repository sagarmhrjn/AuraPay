import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, catchError, finalize, of, switchMap, tap } from 'rxjs';
import {
  ApplicationQueryFilter,
  DashboardStatusCounts,
  MerchantApplication,
  PaginatedApplicationsResponse,
  RiskDecisionPayload,
} from '../models/application.model';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  private readonly http = inject(HttpClient);

  // Reactive State Signals
  readonly applications = signal<MerchantApplication[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly totalItems = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(5);
  readonly totalPages = signal<number>(1);
  readonly statusCounts = signal<DashboardStatusCounts>({
    total: 0,
    draft: 0,
    submitted: 0,
    underReview: 0,
    infoRequested: 0,
    approved: 0,
    rejected: 0,
  });

  // Filter query subject for reactive data flow
  private readonly filterSubject = new BehaviorSubject<ApplicationQueryFilter>({
    page: 1,
    pageSize: 5,
    status: 'ALL',
    riskTier: 'ALL',
    searchTerm: '',
  });
  private readonly statusCountsRefresh = new Subject<void>();
  private activeUserId: string | null | undefined;

  readonly filter$ = this.filterSubject.asObservable();

  constructor() {
    this.initDataStream();
    this.initStatusCountsStream();
    this.loadStatusCounts();
  }

  /** Connects filter changes to application fetching and reactive loading state. */
  private initDataStream(): void {
    this.filter$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap((filter) =>
          this.fetchApplications(filter).pipe(
            catchError((err) => {
              this.error.set(
                err?.error?.message || err?.message || 'Failed to load merchant applications. Please try again.'
              );
              this.applications.set([]);
              this.totalItems.set(0);
              return of(null);
            }),
            finalize(() => this.loading.set(false))
          )
        )
      )
      .subscribe((res) => {
        if (res) {
          this.applications.set(res.items);
          this.totalItems.set(res.total);
          this.currentPage.set(res.page);
          this.pageSize.set(res.pageSize);
          this.totalPages.set(res.totalPages);
        }
      });
  }

  /** Cancels stale count requests so a prior user's response cannot overwrite the current one. */
  private initStatusCountsStream(): void {
    this.statusCountsRefresh
      .pipe(
        switchMap(() =>
          this.http.get<DashboardStatusCounts>('/api/applications/stats').pipe(
            catchError(() => of(null))
          )
        )
      )
      .subscribe((counts) => {
        if (counts) {
          this.statusCounts.set(counts);
        }
      });
  }

  /** Fetches a filtered page of applications from the API. */
  private fetchApplications(filter: ApplicationQueryFilter): Observable<PaginatedApplicationsResponse> {
    let params = new HttpParams()
      .set('page', filter.page.toString())
      .set('pageSize', filter.pageSize.toString());

    if (filter.searchTerm) {
      params = params.set('searchTerm', filter.searchTerm);
    }
    if (filter.status && filter.status !== 'ALL') {
      params = params.set('status', filter.status);
    }
    if (filter.riskTier && filter.riskTier !== 'ALL') {
      params = params.set('riskTier', filter.riskTier);
    }
    if (filter.salesRepId) {
      params = params.set('salesRepId', filter.salesRepId);
    }
    if (filter.assignedReviewerId) {
      params = params.set('assignedReviewerId', filter.assignedReviewerId);
    }

    return this.http.get<PaginatedApplicationsResponse>('/api/applications', { params });
  }

  /** Loads dashboard status totals into the service signal. */
  loadStatusCounts(): void {
    this.statusCountsRefresh.next();
  }

  /** Clears cached dashboard data and reloads when the active account changes. */
  reloadForUser(userId: string | null): void {
    if (this.activeUserId === userId) {
      this.refresh();
      return;
    }

    this.activeUserId = userId;
    this.applications.set([]);
    this.totalItems.set(0);
    this.currentPage.set(1);
    this.totalPages.set(1);
    this.statusCounts.set({
      total: 0,
      draft: 0,
      submitted: 0,
      underReview: 0,
      infoRequested: 0,
      approved: 0,
      rejected: 0,
    });
    this.filterSubject.next({
      page: 1,
      pageSize: this.pageSize(),
      status: 'ALL',
      riskTier: 'ALL',
      searchTerm: '',
    });
    this.loadStatusCounts();
  }

  /** Applies filter changes and resets pagination when a non-page filter changes. */
  setFilter(changes: Partial<ApplicationQueryFilter>): void {
    const current = this.filterSubject.value;
    // When changing filters (other than page), reset page to 1
    const resetPage = changes.page === undefined;
    this.filterSubject.next({
      ...current,
      ...changes,
      page: resetPage ? 1 : (changes.page ?? current.page),
    });
  }

  /** Selects a page while preserving the active filters. */
  setPage(page: number): void {
    this.setFilter({ page });
  }

  /** Changes the page size and restarts pagination from the first page. */
  setPageSize(pageSize: number): void {
    this.setFilter({ pageSize, page: 1 });
  }

  /** Reloads the current application page and dashboard totals. */
  refresh(): void {
    this.filterSubject.next({ ...this.filterSubject.value });
    this.loadStatusCounts();
  }

  /** Retries the current application and status-count requests. */
  retry(): void {
    this.refresh();
  }

  /** Retrieves one application by its identifier. */
  getApplication(id: string): Observable<MerchantApplication> {
    return this.http.get<MerchantApplication>(`/api/applications/${id}`);
  }

  /** Saves a draft and refreshes the dashboard totals. */
  saveDraft(data: Partial<MerchantApplication>): Observable<MerchantApplication> {
    return this.http.post<MerchantApplication>('/api/applications/draft', data).pipe(
      tap(() => this.loadStatusCounts())
    );
  }

  /** Submits an application and refreshes the dashboard data. */
  submitApplication(data: MerchantApplication): Observable<MerchantApplication> {
    return this.http.post<MerchantApplication>('/api/applications', data).pipe(
      tap(() => {
        this.refresh();
        this.loadStatusCounts();
      })
    );
  }

  /** Records an underwriting decision and refreshes application data. */
  recordRiskDecision(id: string, payload: RiskDecisionPayload): Observable<MerchantApplication> {
    return this.http.put<MerchantApplication>(`/api/applications/${id}/decision`, payload).pipe(
      tap(() => {
        this.refresh();
        this.loadStatusCounts();
      })
    );
  }

  /** Assigns a reviewer to an application and refreshes dashboard data. */
  assignReviewer(id: string, reviewerId: string, reviewerName: string): Observable<MerchantApplication> {
    return this.http.put<MerchantApplication>(`/api/applications/${id}/assign`, { reviewerId, reviewerName }).pipe(
      tap(() => {
        this.refresh();
        this.loadStatusCounts();
      })
    );
  }

  /** Triggers the mock endpoint that expires the active token for testing. */
  expireTokenForTesting(): Observable<unknown> {
    return this.http.post('/api/test/expire-token', {});
  }
}
