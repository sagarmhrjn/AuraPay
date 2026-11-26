import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-application-business-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <mat-card class="portal-neutral-card" [formGroup]="group()">
      <mat-card-header class="border-bottom pb-3 mb-3">
        <mat-card-title class="h5 fw-bold">1. Business Profile</mat-card-title>
        <mat-card-subtitle>
          Company identity and Inland Revenue Department (IRD) Permanent Account Number
        </mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="row g-3">
          <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Registered Entity Name</mat-label>
              <input matInput formControlName="legalName" placeholder="e.g. Himalayan Organics Pvt. Ltd." />
              @if (group().get('legalName')?.hasError('required')) {
                <mat-error>Registered business name is required</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Doing Business As (DBA) / Brand Name</mat-label>
              <input matInput formControlName="dbaName" placeholder="e.g. Himalayan Tea" />
            </mat-form-field>
          </div>

          <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Business Entity Type</mat-label>
              <mat-select formControlName="businessType">
                <mat-option value="PVT_LTD">Private Limited (Pvt. Ltd.)</mat-option>
                <mat-option value="PUBLIC_LTD">Public Limited</mat-option>
                <mat-option value="PARTNERSHIP">Partnership Firm</mat-option>
                <mat-option value="SOLE_PROP">Sole Proprietorship</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Permanent Account Number (PAN)</mat-label>
              <input matInput formControlName="pan" placeholder="e.g. 601234567" maxlength="9" />
              <mat-hint>IRD issued 9-digit numeric PAN</mat-hint>
              @if (group().get('pan')?.hasError('required')) {
                <mat-error>9-digit PAN number is required</mat-error>
              } @else if (group().get('pan')?.hasError('invalidPan')) {
                <mat-error>Must be exactly 9 numeric digits</mat-error>
              }
            </mat-form-field>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
})
export class ApplicationBusinessStepComponent {
  readonly group = input.required<FormGroup>();
}
