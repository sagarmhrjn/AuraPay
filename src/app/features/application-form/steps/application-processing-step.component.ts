import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-application-processing-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <mat-card class="portal-neutral-card" [formGroup]="group()">
      <mat-card-header class="border-bottom pb-3 mb-3">
        <mat-card-title class="h5 fw-bold">3. Processing Volume & NCHL Settlement Banking</mat-card-title>
        <mat-card-subtitle>
          Direct bank settlement via Nepal Clearing House Limited (NCHL / connectIPS)
        </mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="row g-3">
          <div class="col-md-4">
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Estimated Monthly Volume (रू / NPR)</mat-label>
              <input matInput type="number" formControlName="estimatedMonthlyVolume" />
              @if (group().get('estimatedMonthlyVolume')?.hasError('required')) {
                <mat-error>Monthly volume is required</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="col-md-4">
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Average Ticket Size (रू / NPR)</mat-label>
              <input matInput type="number" formControlName="averageTicketSize" />
            </mat-form-field>
          </div>

          <div class="col-md-4">
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>High Ticket Size (रू / NPR)</mat-label>
              <input matInput type="number" formControlName="highTicketSize" />
              @if (group().get('highTicketSize')?.hasError('highTicketLessThanAverage')) {
                <mat-error>High ticket must be &ge; average ticket size</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Settlement Commercial Bank (Class A)</mat-label>
              <mat-select formControlName="bankName">
                @for (bank of banks(); track bank) {
                  <mat-option [value]="bank">{{ bank }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>NCHL / IPS Member Clearing Routing Code</mat-label>
              <input matInput formControlName="bankRoutingNumber" placeholder="9-digit clearing code" maxlength="9" />
              <mat-hint>Verified via 9-digit weighted checksum algorithm</mat-hint>
              @if (group().get('bankRoutingNumber')?.hasError('required')) {
                <mat-error>NCHL routing code is required</mat-error>
              } @else if (group().get('bankRoutingNumber')?.hasError('invalidAbaChecksum')) {
                <mat-error>Failed 9-digit weighted checksum validation</mat-error>
              } @else if (group().get('bankRoutingNumber')?.hasError('invalidAbaLength')) {
                <mat-error>Must be exactly 9 numeric digits</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="col-12">
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Bank Account Number (खाता नं)</mat-label>
              <input matInput formControlName="bankAccountNumber" placeholder="e.g. 01201017500123" />
              <mat-hint>Sensitive: Masked by default in portal review</mat-hint>
              @if (group().get('bankAccountNumber')?.hasError('required')) {
                <mat-error>Bank account number is required</mat-error>
              }
            </mat-form-field>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
})
export class ApplicationProcessingStepComponent {
  readonly group = input.required<FormGroup>();
  readonly banks = input.required<readonly string[]>();
}
