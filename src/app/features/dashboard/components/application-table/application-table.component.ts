import { Component, inject, input, output, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MerchantApplication } from '../../../../core/models/application.model';
import { AuthService } from '../../../../core/services/auth.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-application-table, app-dashboard-table',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    StatusBadgeComponent
],
  templateUrl: './application-table.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './application-table.component.scss',
})
export class ApplicationTableComponent {
  readonly authService = inject(AuthService);

  readonly applications = input<MerchantApplication[]>([]);
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly totalItems = input<number>(0);
  readonly currentPage = input<number>(1);
  readonly pageSize = input<number>(10);
  readonly totalPages = input<number>(1);

  readonly retry = output<void>();
  readonly clearFilters = output<void>();
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  /** Converts a page-local row index into its one-based result index. */
  getRowIndex(localIndex: number): number {
    return (this.currentPage() - 1) * this.pageSize() + localIndex + 1;
  }

  /** Returns the one-based index of the first displayed result. */
  getStartIndex(): number {
    const total = this.totalItems();
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  /** Returns the one-based index of the last displayed result. */
  getEndIndex(): number {
    const total = this.totalItems();
    const calculated = this.currentPage() * this.pageSize();
    return Math.min(calculated, total);
  }

  /** Returns the page numbers available for the current result set. */
  getPageNumbers(): number[] {
    const totalPages = this.totalPages();
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  /** Emits a page change when the requested page is in range. */
  onPageClick(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }

  /** Emits the selected page size as a number. */
  onPageSizeSelect(size: number | string): void {
    this.pageSizeChange.emit(Number(size));
  }

  /** Forwards a retry request to the table's parent. */
  onRetry(): void {
    this.retry.emit();
  }

  /** Forwards a clear-filters request to the table's parent. */
  onClearFilters(): void {
    this.clearFilters.emit();
  }
}
