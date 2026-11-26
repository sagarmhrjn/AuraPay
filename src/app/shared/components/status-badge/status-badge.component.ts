import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationStatus, RiskTier } from '../../../core/constants/application.const';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatChipsModule, MatIconModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  readonly status = input<ApplicationStatus | null | undefined>(null);
  readonly riskTier = input<RiskTier | null | undefined>(null);

  /** Returns the CSS class associated with the current application status. */
  statusBadgeClass(): string {
    switch (this.status()) {
      case 'APPROVED':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'UNDER_REVIEW':
        return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'SUBMITTED':
        return 'bg-info-subtle text-info-emphasis border border-info-subtle';
      case 'INFO_REQUESTED':
        return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      case 'REJECTED':
        return 'bg-danger-subtle text-danger border border-danger-subtle';
      case 'DRAFT':
        return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
      default:
        return 'bg-light text-dark';
    }
  }

  /** Returns the Material icon associated with the current application status. */
  statusMatIcon(): string {
    switch (this.status()) {
      case 'APPROVED':
        return 'check_circle';
      case 'UNDER_REVIEW':
        return 'hourglass_top';
      case 'SUBMITTED':
        return 'send';
      case 'INFO_REQUESTED':
        return 'error';
      case 'REJECTED':
        return 'cancel';
      case 'DRAFT':
        return 'edit_note';
      default:
        return 'help_outline';
    }
  }

  /** Returns the display label for the current application status. */
  statusLabel(): string {
    switch (this.status()) {
      case 'APPROVED':
        return 'Approved';
      case 'UNDER_REVIEW':
        return 'Under Review';
      case 'SUBMITTED':
        return 'Submitted';
      case 'INFO_REQUESTED':
        return 'Action Required';
      case 'REJECTED':
        return 'Rejected';
      case 'DRAFT':
        return 'Draft';
      default:
        return this.status() || '';
    }
  }

  /** Returns the CSS class associated with the current risk tier. */
  riskBadgeClass(): string {
    switch (this.riskTier()) {
      case 'LOW':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'MEDIUM':
        return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      case 'HIGH':
        return 'bg-danger-subtle text-danger border border-danger-subtle';
      case 'CRITICAL':
        return 'bg-danger text-white';
      default:
        return 'bg-light text-dark';
    }
  }

  /** Returns the Material icon associated with the current risk tier. */
  riskMatIcon(): string {
    switch (this.riskTier()) {
      case 'LOW':
        return 'verified_user';
      case 'MEDIUM':
        return 'shield';
      case 'HIGH':
      case 'CRITICAL':
        return 'warning';
      default:
        return 'security';
    }
  }
}
