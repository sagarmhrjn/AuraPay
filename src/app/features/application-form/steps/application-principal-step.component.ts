import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-application-principal-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-card class="portal-neutral-card" [formGroup]="group()">
      <mat-card-header class="border-bottom pb-3 mb-3">
        <mat-card-title class="h5 fw-bold">2. Principal / Beneficial Owner (KYC)</mat-card-title>
        <mat-card-subtitle>
          Nepal Rastra Bank (NRB) and FIU GoAML beneficial ownership identification
        </mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="row g-3">
          <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Director / Principal Full Name</mat-label>
              <input matInput formControlName="fullName" placeholder="e.g. Bikash Thapa" />
              @if (group().get('fullName')?.hasError('required')) {
                <mat-error>Principal full name is required</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Share Ownership (%)</mat-label>
              <input matInput type="number" formControlName="ownershipPercentage" min="1" max="100" />
              <mat-hint>NRB AML/CFT CDD threshold &ge; 25% ownership</mat-hint>
              @if (group().get('ownershipPercentage')?.hasError('required')) {
                <mat-error>Ownership percentage is required</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="col-md-6">
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Citizenship Certificate No. (नागरिकता नं) / National ID</mat-label>
              <input matInput formControlName="citizenshipNumber" placeholder="e.g. 27-01-78-12345" />
              <mat-hint>District citizenship no. or 10-digit National Identity Card (NID)</mat-hint>
              @if (group().get('citizenshipNumber')?.hasError('required')) {
                <mat-error>Citizenship or National ID number is required</mat-error>
              } @else if (group().get('citizenshipNumber')?.hasError('invalidCitizenship')) {
                <mat-error>Invalid format (e.g. 27-01-78-12345 or 10-digit NID)</mat-error>
              }
            </mat-form-field>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
})
export class ApplicationPrincipalStepComponent {
  readonly group = input.required<FormGroup>();
}
