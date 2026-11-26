import { Component, OnDestroy, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import { DraftAutoSaveService } from '../../core/services/draft-autosave.service';
import { ToastService } from '../../core/services/toast.service';
import { MerchantValidators } from '../../core/validators/merchant-validators';
import { MerchantApplication } from '../../core/models/application.model';
import { ApplicationBusinessStepComponent } from './steps/application-business-step.component';
import { ApplicationPrincipalStepComponent } from './steps/application-principal-step.component';
import { ApplicationProcessingStepComponent } from './steps/application-processing-step.component';
import { ApplicationReviewStepComponent } from './steps/application-review-step.component';

@Component({
  selector: 'app-application-wizard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    ApplicationBusinessStepComponent,
    ApplicationPrincipalStepComponent,
    ApplicationProcessingStepComponent,
    ApplicationReviewStepComponent
],
  providers: [DraftAutoSaveService],
  templateUrl: './application-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './application-form.component.scss',
})
export class ApplicationFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly applicationService = inject(ApplicationService);
  readonly authService = inject(AuthService);
  readonly autoSave = inject(DraftAutoSaveService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly currentStep = signal<number>(1);
  readonly steps = [
    { index: 1, title: 'Business Profile' },
    { index: 2, title: 'Principal & KYC' },
    { index: 3, title: 'Processing & Banking' },
    { index: 4, title: 'Review & Submit' },
  ];

  // Nepal Commercial Banks (Class A)
  readonly nepalBanks = [
    'Nabil Bank Ltd.',
    'Global IME Bank Ltd.',
    'NIC Asia Bank Ltd.',
    'Nepal Investment Mega Bank',
    'Himalayan Bank Ltd.',
    'Sanima Bank Ltd.',
    'Standard Chartered Bank Nepal',
    'Everest Bank Ltd.',
    'Prabhu Bank Ltd.',
    'Siddhartha Bank Ltd.',
  ];

  isEditMode = false;
  editingId: string | null = null;
  private editingStatus: MerchantApplication['status'] = 'DRAFT';
  isSubmitting = false;

  wizardForm!: FormGroup;
  private formSub: Subscription | null = null;

  /** Returns the nested business-profile form group. */
  get businessProfileGroup(): FormGroup {
    return this.wizardForm.get('businessProfile') as FormGroup;
  }

  /** Returns the nested principal-profile form group. */
  get principalProfileGroup(): FormGroup {
    return this.wizardForm.get('principalProfile') as FormGroup;
  }

  /** Returns the nested processing-profile form group. */
  get processingProfileGroup(): FormGroup {
    return this.wizardForm.get('processingProfile') as FormGroup;
  }

  /** Initializes the form, edit-mode state, and draft autosave subscription. */
  ngOnInit(): void {
    this.buildForm();
    this.checkRouteForEdit();
    this.setupAutoSavePipeline();
  }

  /** Creates the wizard form groups, validators, and mirrored legacy fields. */
  private buildForm(): void {
    this.wizardForm = this.fb.group({
      id: [''],
      businessProfile: this.fb.group({
        legalName: ['', [Validators.required, Validators.minLength(3)]],
        dbaName: [''],
        businessType: ['PVT_LTD', Validators.required],
        pan: ['', [Validators.required, MerchantValidators.pan()]],
        ein: [''],
      }),
      principalProfile: this.fb.group({
        fullName: ['', [Validators.required, Validators.minLength(3)]],
        ownershipPercentage: [100, [Validators.required, Validators.min(1), Validators.max(100)]],
        citizenshipNumber: ['', [Validators.required, MerchantValidators.citizenship()]],
        ssn: [''],
      }),
      processingProfile: this.fb.group(
        {
          estimatedMonthlyVolume: [500000, [Validators.required, Validators.min(1000)]],
          averageTicketSize: [1500, [Validators.required, Validators.min(1)]],
          highTicketSize: [15000, [Validators.required, Validators.min(1)]],
          bankName: ['Nabil Bank Ltd.', Validators.required],
          bankRoutingNumber: ['121000358', [Validators.required, MerchantValidators.nchlRouting()]],
          bankAccountNumber: ['', [Validators.required, MerchantValidators.bankAccountNumber()]],
        },
        { validators: [MerchantValidators.ticketSizes()] }
      ),
      complianceRisk: this.fb.group({
        termsAccepted: [false, Validators.requiredTrue],
        signerFullName: ['', [Validators.required, Validators.minLength(3)]],
      }),
    });

    // Keep aliases synced
    this.wizardForm.get('businessProfile.pan')?.valueChanges.subscribe((val) => {
      this.wizardForm.get('businessProfile.ein')?.setValue(val, { emitEvent: false });
    });
    this.wizardForm.get('principalProfile.citizenshipNumber')?.valueChanges.subscribe((val) => {
      this.wizardForm.get('principalProfile.ssn')?.setValue(val, { emitEvent: false });
    });
  }

  /** Loads the application identified by the route for editing, when present. */
  private checkRouteForEdit(): void {
    const id = this.route.snapshot?.paramMap?.get('id') || this.route.snapshot?.queryParamMap?.get('id');
    if (id) {
      this.isEditMode = true;
      this.editingId = id;
      this.autoSave.setDraftId(id);

      this.applicationService.getApplication(id).subscribe({
        next: (app) => {
          if (!this.authService.canEditApplication(app)) {
            this.toast.error('Access Restricted', 'You cannot edit this merchant application.');
            this.router.navigate(['/unauthorized'], {
              queryParams: { reason: 'APPLICATION_EDIT_DENIED', id: app.id },
            });
            return;
          }
          this.patchFormWithApplication(app);
        },
        error: (err) => {
          if (err?.status === 403) {
            this.toast.error('Access Restricted', 'You cannot edit this merchant application.');
            this.router.navigate(['/unauthorized'], {
              queryParams: { reason: 'APPLICATION_EDIT_DENIED', id },
            });
            return;
          }
          console.error('Failed to load application for editing:', err);
          this.toast.error('Error', 'Unable to load draft application data.');
          this.router.navigate(['/applications']);
        },
      });
    }
  }

  /** Populates the wizard form while keeping legacy field aliases synchronized. */
  private patchFormWithApplication(app: MerchantApplication): void {
    this.editingStatus = app.status;
    const panValue = app.businessProfile.pan || app.businessProfile.ein || '';
    const citizenshipValue = app.principalProfile.citizenshipNumber || app.principalProfile.ssn || '';

    this.wizardForm.patchValue({
      ...app,
      businessProfile: {
        ...app.businessProfile,
        pan: panValue,
        ein: panValue,
      },
      principalProfile: {
        ...app.principalProfile,
        citizenshipNumber: citizenshipValue,
        ssn: citizenshipValue,
      },
    });
  }

  /** Queues valid form changes for draft autosave while editing is active. */
  private setupAutoSavePipeline(): void {
    this.formSub = this.wizardForm.valueChanges.subscribe((rawVal) => {
      if (this.wizardForm.dirty && !this.isSubmitting) {
        this.autoSave.queueAutoSave(this.prepareDraftPayload(rawVal));
      }
    });
  }

  /** Saves the current form values immediately as a draft. */
  saveDraftManual(): void {
    const rawVal = this.wizardForm.getRawValue();
    this.autoSave.saveImmediately(this.prepareDraftPayload(rawVal));
    this.toast.info('Draft Saved', 'Merchant application draft saved successfully.');
  }

  /** Normalizes form values into the payload shape expected by draft persistence. */
  private prepareDraftPayload(rawVal: any): Partial<MerchantApplication> {
    const user = this.authService.currentUser();
    const pan = rawVal.businessProfile?.pan || rawVal.businessProfile?.ein || '';
    const citizenship = rawVal.principalProfile?.citizenshipNumber || rawVal.principalProfile?.ssn || '';

    return {
      id: this.editingId || this.autoSave.currentDraftId() || undefined,
      salesRepId: user?.id ?? 'usr-sales-01',
      salesRepName: user?.name ?? 'Aayush Shrestha',
      status: this.isEditMode ? this.editingStatus : 'DRAFT',
      businessProfile: {
        ...rawVal.businessProfile,
        pan,
        ein: pan,
      },
      principalProfile: {
        ...rawVal.principalProfile,
        citizenshipNumber: citizenship,
        ssn: citizenship,
      },
      processingProfile: {
        ...rawVal.processingProfile,
        currency: 'NPR',
      },
      complianceRisk: {
        termsAccepted: !!rawVal.complianceRisk?.termsAccepted,
        signerFullName: rawVal.complianceRisk?.signerFullName || '',
        signedAt: rawVal.complianceRisk?.termsAccepted ? new Date().toISOString() : '',
      },
      riskAssessment: {
        riskScore: 25,
        riskTier: 'LOW',
        decisionHistory: [],
      },
    };
  }

  /** Validates the current step before advancing to the next wizard step. */
  nextStep(): void {
    const current = this.currentStep();
    if (this.validateCurrentStep(current)) {
      this.currentStep.set(Math.min(4, current + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.toast.warning('Validation Required', 'Please complete all required fields on this step.');
    }
  }

  /** Moves to the previous wizard step. */
  prevStep(): void {
    this.currentStep.set(Math.max(1, this.currentStep() - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Navigates to an accessible step, validating the current step when moving forward. */
  goToStep(stepNumber: number): void {
    if (stepNumber <= this.currentStep() || this.validateCurrentStep(this.currentStep())) {
      this.currentStep.set(stepNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** Marks invalid fields as touched and reports whether the requested step is valid. */
  validateCurrentStep(step: number): boolean {
    let group: FormGroup | null = null;
    switch (step) {
      case 1:
        group = this.wizardForm.get('businessProfile') as FormGroup;
        break;
      case 2:
        group = this.wizardForm.get('principalProfile') as FormGroup;
        break;
      case 3:
        group = this.wizardForm.get('processingProfile') as FormGroup;
        break;
      case 4:
        return this.wizardForm.valid;
    }

    if (group) {
      if (group.invalid) {
        group.markAllAsTouched();
        return false;
      }
      return true;
    }
    return true;
  }

  /** Validates and submits the completed merchant application. */
  onSubmit(): void {
    if (this.wizardForm.invalid) {
      this.wizardForm.markAllAsTouched();
      this.toast.error('Validation Error', 'Please complete all required fields and accept terms.');
      return;
    }

    this.isSubmitting = true;
    const rawVal = this.wizardForm.getRawValue();
    const user = this.authService.currentUser();
    const pan = rawVal.businessProfile.pan || rawVal.businessProfile.ein;
    const citizenship = rawVal.principalProfile.citizenshipNumber || rawVal.principalProfile.ssn;

    const applicationPayload: MerchantApplication = {
      id: this.editingId || this.autoSave.currentDraftId() || `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      status: 'SUBMITTED',
      salesRepId: user?.id ?? 'usr-sales-01',
      salesRepName: user?.name ?? 'Aayush Shrestha',
      businessProfile: {
        ...rawVal.businessProfile,
        pan,
        ein: pan,
      },
      principalProfile: {
        ...rawVal.principalProfile,
        citizenshipNumber: citizenship,
        ssn: citizenship,
      },
      processingProfile: {
        ...rawVal.processingProfile,
        currency: 'NPR',
      },
      complianceRisk: {
        termsAccepted: true,
        signerFullName: rawVal.complianceRisk.signerFullName,
        signedAt: new Date().toISOString(),
      },
      riskAssessment: {
        riskScore: 25,
        riskTier: 'LOW',
        decisionHistory: [],
      },
    };

    this.applicationService.submitApplication(applicationPayload).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        this.toast.success('Application Submitted', `Application ${result.id} submitted for underwriting.`);
        this.router.navigate(['/applications', result.id]);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.toast.error('Submission Failed', err?.error?.message || 'Could not submit application.');
      },
    });
  }

  /** Releases the form-value subscription when the wizard is destroyed. */
  ngOnDestroy(): void {
    if (this.formSub) {
      this.formSub.unsubscribe();
    }
  }
}
