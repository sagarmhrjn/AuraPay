import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import {
  MerchantApplication,
  RiskDecisionPayload,
} from '../../core/models/application.model';
import { RiskTier } from '../../core/constants/application.const';
import { ApplicationAuditTimelineComponent } from './components/application-audit-timeline.component';
import { ApplicationDecisionPanelComponent } from './components/application-decision-panel.component';
import { ApplicationProfileComponent } from './components/application-profile.component';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    StatusBadgeComponent,
    ApplicationAuditTimelineComponent,
    ApplicationDecisionPanelComponent,
    ApplicationProfileComponent,
  ],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss',
})
export class ApplicationDetailComponent implements OnInit {
  private readonly applicationService = inject(ApplicationService);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly application = signal<MerchantApplication | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  // Reviewer Decision Form
  decisionAction: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' = 'APPROVE';
  assignedTier: RiskTier = 'LOW';
  approvedLimit = 500000;
  rejectionCode = 'PROHIBITED_MCC_RESTRICTED_INDUSTRY';
  decisionNote = '';
  readonly isSubmittingDecision = signal(false);

  // Admin Assignment Modal
  readonly isAssignModalOpen = signal(false);
  selectedReviewerId = 'usr-rev-02';
  readonly isAssigning = signal(false);
  readonly reviewers = [
    { id: 'usr-rev-01', name: 'Pradeep Adhikari' },
    { id: 'usr-rev-02', name: 'Jeshan Joshi' },
    { id: 'usr-rev-05', name: 'Emily Watson' },
    { id: 'usr-rev-08', name: 'Devon Vance' },
  ] as const;

  /** Loads the application identified by the current route. */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No application ID specified.');
      this.loading.set(false);
      return;
    }

    this.loadApplication(id);
  }

  /** Fetches an application, enforces access rules, and updates the page state. */
  loadApplication(id: string): void {
    this.loading.set(true);
    this.applicationService.getApplication(id).subscribe({
      next: (app) => {
        if (!this.authService.canAccessApplication(app)) {
          this.toast.error(
            'Access Restricted',
            `Sales rep cannot access applications belonging to other representatives per security policy.`
          );
          this.router.navigate(['/unauthorized'], {
            queryParams: { reason: 'UNAUTHORIZED_APPLICATION_ACCESS', id: app.id },
          });
          return;
        }

        this.application.set(app);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Application not found.');
        this.loading.set(false);
      },
    });
  }

  /** Records the selected underwriting decision and refreshes the displayed application. */
  submitDecision(): void {
    const app = this.application();
    if (!app || !this.decisionNote.trim()) return;

    this.isSubmittingDecision.set(true);
    const payload: RiskDecisionPayload = {
      action: this.decisionAction,
      note: this.decisionNote.trim(),
      riskTier: this.decisionAction === 'APPROVE' ? this.assignedTier : undefined,
      approvedLimit: this.decisionAction === 'APPROVE' ? this.approvedLimit : undefined,
      rejectionReasonCode: this.decisionAction === 'REJECT' ? this.rejectionCode : undefined,
    };

    this.applicationService.recordRiskDecision(app.id, payload).subscribe({
      next: (updatedApp) => {
        this.setApplication(updatedApp);
        this.isSubmittingDecision.set(false);
        this.decisionNote = '';
        this.toast.success(
          'Decision Recorded',
          `Application ${app.id} marked as ${updatedApp.status}. Audit history updated.`
        );
      },
      error: (err) => {
        this.isSubmittingDecision.set(false);
        this.toast.error('Decision Failed', err?.error?.message || 'Failed to record risk decision.');
      },
    });
  }

  /** Opens reviewer assignment with the currently assigned reviewer selected. */
  openAssignModal(): void {
    const assignedReviewerId = this.application()?.assignedReviewerId;
    this.selectedReviewerId =
      this.reviewers.find((reviewer) => reviewer.id === assignedReviewerId)?.id ?? this.reviewers[0].id;
    this.isAssignModalOpen.set(true);
  }

  /** Closes the assignment dialog when no assignment request is in progress. */
  closeAssignModal(): void {
    if (!this.isAssigning()) {
      this.isAssignModalOpen.set(false);
    }
  }

  /** Assigns the selected reviewer to the current application. */
  confirmAssignment(): void {
    const app = this.application();
    if (!app) return;

    const reviewer = this.reviewers.find((item) => item.id === this.selectedReviewerId);
    if (!reviewer) {
      this.toast.error('Assignment Failed', 'Select a valid reviewer before assigning.');
      return;
    }

    this.isAssigning.set(true);
    this.applicationService.assignReviewer(app.id, reviewer.id, reviewer.name).subscribe({
      next: (updatedApp) => {
        this.setApplication(updatedApp);
        this.isAssigning.set(false);
        this.closeAssignModal();
        this.toast.success('Assigned', `Application assigned to ${reviewer.name}`);
      },
      error: (err) => {
        this.isAssigning.set(false);
        this.toast.error('Assignment Failed', err?.error?.message || 'Failed to assign reviewer.');
      },
    });
  }

  /** Replaces nested decision history references so OnPush views update after a mutation. */
  private setApplication(application: MerchantApplication): void {
    this.application.set({
      ...application,
      riskAssessment: {
        ...application.riskAssessment,
        decisionHistory: [...application.riskAssessment.decisionHistory],
      },
    });
  }
}
