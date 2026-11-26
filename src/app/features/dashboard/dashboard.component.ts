import { Component, OnDestroy, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { ToastService } from '../../core/services/toast.service';
import { KpiCardItem } from './data-access/models/kpi-card-item.model';
import { kpiCards } from './data-access/constants/kpi-cards.config';
import { RISK_TIER_OPTIONS, STATUS_OPTIONS } from './data-access/constants/filter-options.config';
import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { ApplicationStatus, RiskTier } from '../../core/constants/application.const';
import { ApplicationTableComponent } from './components/application-table/application-table.component';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    ApplicationTableComponent,
    KpiCardComponent,
    DropdownComponent,
    SearchInputComponent
],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly applicationService = inject(ApplicationService);
  readonly authService = inject(AuthService);
  readonly socketService = inject(SocketService);
  private readonly toast = inject(ToastService);

  readonly kpiCards: readonly KpiCardItem[] = kpiCards;
  readonly statusOptions = STATUS_OPTIONS;
  readonly riskTierOptions = RISK_TIER_OPTIONS;

  searchTerm = '';
  selectedStatus: ApplicationStatus | 'ALL' = 'ALL';
  selectedRiskTier: RiskTier | 'ALL' = 'ALL';

  private socketSub: Subscription | null = null;
  private readonly searchSubject = new Subject<string>();
  private searchSub: Subscription | null = null;

  /** Starts the real-time event and debounced search subscriptions. */
  ngOnInit(): void {
    this.applicationService.reloadForUser(this.authService.currentUser()?.id ?? null);
    this.setupSocketListener();
    this.setupSearchListener();
  }

  /** Debounces search input before applying dashboard filters. */
  private setupSearchListener(): void {
    this.searchSub = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.applyFilters();
      });
  }

  /** Sends the current search term into the debounce stream. */
  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  /** Subscribes to application events and refreshes the dashboard on updates. */
  private setupSocketListener(): void {
    this.socketSub = this.socketService.on<{
      applicationId: string;
      newStatus?: ApplicationStatus;
      message: string;
    }>('application:status_changed').subscribe((event) => {
      this.toast.info('Real-time Update', event.message);
      this.applicationService.refresh();
    });

    this.socketService.on<{
      applicationId: string;
      legalName: string;
      message: string;
    }>('application:new').subscribe((event) => {
      this.toast.success('New Application', `${event.legalName} (${event.applicationId}) submitted.`);
      this.applicationService.refresh();
    });
  }

  /** Applies the selected search, status, risk, and ownership filters. */
  applyFilters(): void {
    this.applicationService.setFilter({
      searchTerm: this.searchTerm.trim(),
      status: this.selectedStatus,
      riskTier: this.selectedRiskTier,
    });
  }

  /** Updates the selected status and reapplies dashboard filters. */
  filterByStatus(status: ApplicationStatus | 'ALL'): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  /** Restores all dashboard filters to their default values. */
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
    this.selectedRiskTier = 'ALL';
    this.applicationService.setFilter({
      searchTerm: '',
      status: 'ALL',
      riskTier: 'ALL',
      page: 1,
    });
  }

  /** Retries the failed dashboard data requests. */
  retry(): void {
    this.applicationService.retry();
  }

  /** Navigates to a page within the current result range. */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.applicationService.totalPages()) {
      this.applicationService.setPage(page);
    }
  }

  /** Updates the number of application rows displayed per page. */
  onPageSizeChange(size: number): void {
    this.applicationService.setPageSize(size);
  }

  /** Releases active socket and search subscriptions. */
  ngOnDestroy(): void {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
  }
}
