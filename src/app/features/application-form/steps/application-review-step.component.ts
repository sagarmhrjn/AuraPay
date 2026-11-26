import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MaskSensitivePipe } from '../../../shared/pipes/mask.pipe';

@Component({
  selector: 'app-application-review-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MaskSensitivePipe,
  ],
  template: `
    <div class="d-flex flex-column gap-3" [formGroup]="form()">
      <div class="row g-3">
        <div class="col-md-4">
          <mat-card class="portal-neutral-card h-100">
            <mat-card-header>
              <mat-card-title class="h6 fw-bold">Business</mat-card-title>
            </mat-card-header>
            <mat-card-content class="small">
              <div><strong>Legal:</strong> {{ form().get('businessProfile.legalName')?.value }}</div>
              <div><strong>DBA:</strong> {{ form().get('businessProfile.dbaName')?.value || 'N/A' }}</div>
              <div><strong>Type:</strong> {{ form().get('businessProfile.businessType')?.value }}</div>
              <div>
                <strong>PAN:</strong>
                {{ form().get('businessProfile.pan')?.value || form().get('businessProfile.ein')?.value }}
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="col-md-4">
          <mat-card class="portal-neutral-card h-100">
            <mat-card-header>
              <mat-card-title class="h6 fw-bold">Principal (KYC)</mat-card-title>
            </mat-card-header>
            <mat-card-content class="small">
              <div><strong>Name:</strong> {{ form().get('principalProfile.fullName')?.value }}</div>
              <div><strong>Equity:</strong> {{ form().get('principalProfile.ownershipPercentage')?.value }}%</div>
              <div>
                <strong>Citizenship / ID:</strong>
                {{
                  (form().get('principalProfile.citizenshipNumber')?.value ||
                    form().get('principalProfile.ssn')?.value) | maskSensitive: 'CITIZENSHIP'
                }}
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="col-md-4">
          <mat-card class="portal-neutral-card h-100">
            <mat-card-header>
              <mat-card-title class="h6 fw-bold">NCHL Settlement</mat-card-title>
            </mat-card-header>
            <mat-card-content class="small">
              <div><strong>Bank:</strong> {{ form().get('processingProfile.bankName')?.value }}</div>
              <div>
                <strong>Volume:</strong>
                रू {{ $safeNavigationMigration(form().get('processingProfile.estimatedMonthlyVolume')?.value) | number }}
              </div>
              <div>
                <strong>Avg / High:</strong>
                रू {{ form().get('processingProfile.averageTicketSize')?.value }} /
                रू {{ form().get('processingProfile.highTicketSize')?.value }}
              </div>
              <div>
                <strong>Account:</strong>
                {{ $safeNavigationMigration(form().get('processingProfile.bankAccountNumber')?.value) | maskSensitive: 'BANK_ACCOUNT' }}
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <mat-card class="portal-neutral-card" formGroupName="complianceRisk">
        <mat-card-header class="border-bottom pb-3 mb-3">
          <mat-card-title class="h5 fw-bold">Regulatory Attestation & Electronic Signature</mat-card-title>
          <mat-card-subtitle>
            Compliance with Nepal Rastra Bank (NRB) Payment Systems Directives & Electronic Transactions Act 2063
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="row g-3">
            <div class="col-md-6">
              <mat-form-field appearance="outline" class="w-100">
                <mat-label>Signer Full Legal Name</mat-label>
                <input matInput formControlName="signerFullName"
                  placeholder="e.g. Authorized Signatory / Director" />
                @if (form().get('complianceRisk.signerFullName')?.hasError('required')) {
                  <mat-error>Signer name is required</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="col-12">
              <mat-checkbox formControlName="termsAccepted" color="primary">
                <span>
                  I attest under the Electronic Transactions Act 2063 that all submitted business PAN, beneficial
                  ownership, and commercial bank details are accurate and adhere to Nepal Rastra Bank merchant
                  acquiring guidelines.
                </span>
              </mat-checkbox>
              @if (form().get('complianceRisk.termsAccepted')?.hasError('required')) {
                <div class="text-danger small mt-1">You must accept the terms before submitting.</div>
              }
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class ApplicationReviewStepComponent {
  readonly form = input.required<FormGroup>();
}
