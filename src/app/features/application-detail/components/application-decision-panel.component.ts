import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RiskTier } from '../../../core/constants/application.const';
import { RiskDecisionPayload } from '../../../core/models/application.model';

@Component({
  selector: 'app-application-decision-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <mat-card class="portal-neutral-card">
      <mat-card-header class="border-bottom pb-2 mb-3">
        <mat-card-title class="h6 fw-bold">Underwriting Decision</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (canRecordDecision()) {
          <div class="d-flex flex-column gap-3">
            <div class="btn-group w-100" role="group">
              <button type="button" class="btn btn-sm fw-medium"
                [class.btn-success]="decisionAction() === 'APPROVE'"
                [class.btn-outline-success]="decisionAction() !== 'APPROVE'"
                (click)="decisionAction.set('APPROVE')">
                Approve
              </button>
              <button type="button" class="btn btn-sm fw-medium"
                [class.btn-warning]="decisionAction() === 'REQUEST_INFO'"
                [class.btn-outline-warning]="decisionAction() !== 'REQUEST_INFO'"
                (click)="decisionAction.set('REQUEST_INFO')">
                Request Info
              </button>
              <button type="button" class="btn btn-sm fw-medium"
                [class.btn-danger]="decisionAction() === 'REJECT'"
                [class.btn-outline-danger]="decisionAction() !== 'REJECT'"
                (click)="decisionAction.set('REJECT')">
                Reject
              </button>
            </div>

            @if (decisionAction() === 'APPROVE') {
              <div class="row g-2">
                <div class="col-6">
                  <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Risk Tier</mat-label>
                    <mat-select [ngModel]="assignedTier()" (ngModelChange)="assignedTier.set($event)">
                      <mat-option value="LOW">LOW</mat-option>
                      <mat-option value="MEDIUM">MEDIUM</mat-option>
                      <mat-option value="HIGH">HIGH</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                <div class="col-6">
                  <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Approved Limit (रू / NPR)</mat-label>
                    <input matInput type="number" [ngModel]="approvedLimit()"
                      (ngModelChange)="approvedLimit.set($event)" />
                  </mat-form-field>
                </div>
              </div>
            }

            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Underwriter Decision Notes</mat-label>
              <textarea matInput rows="3" [ngModel]="decisionNote()"
                (ngModelChange)="decisionNote.set($event)"
                placeholder="Enter justification based on NRB KYC/AML guidelines..."></textarea>
            </mat-form-field>

            <button mat-flat-button
              [color]="decisionAction() === 'APPROVE' ? 'primary' : (decisionAction() === 'REJECT' ? 'warn' : 'accent')"
              (click)="submit.emit()" [disabled]="isSubmitting() || !decisionNote().trim()">
              @if (isSubmitting()) {
                <span>Saving...</span>
              } @else {
                <span>Record {{ decisionAction() }} Decision</span>
              }
            </button>
          </div>
        } @else {
          <div class="alert alert-light border p-3 text-center mb-0">
            <mat-icon class="text-secondary mb-1">lock</mat-icon>
            <div class="fw-semibold text-dark small">Underwriting Controls Restricted</div>
            <div class="text-muted small">
              Only Risk Underwriters and Compliance Officers possess decision authority.
            </div>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class ApplicationDecisionPanelComponent {
  readonly canRecordDecision = input(false);
  readonly isSubmitting = input(false);

  readonly decisionAction = model<RiskDecisionPayload['action']>('APPROVE');
  readonly assignedTier = model<RiskTier>('LOW');
  readonly approvedLimit = model(500000);
  readonly decisionNote = model('');

  readonly submit = output<void>();
}
