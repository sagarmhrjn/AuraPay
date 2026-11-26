import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute } from '@angular/router';
import { describe, beforeEach, expect, it } from 'vitest';
import { ApplicationFormComponent } from './application-form.component';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';

describe('ApplicationFormComponent', () => {
  let component: ApplicationFormComponent;
  let fixture: ComponentFixture<ApplicationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationFormComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withXhr()),
        provideAnimationsAsync(),
        ApplicationService,
        AuthService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: () => null },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize Reactive Form with all 4 workflow sub-groups', () => {
    expect(component.wizardForm).toBeTruthy();
    expect(component.wizardForm.get('businessProfile')).toBeTruthy();
    expect(component.wizardForm.get('principalProfile')).toBeTruthy();
    expect(component.wizardForm.get('processingProfile')).toBeTruthy();
    expect(component.wizardForm.get('complianceRisk')).toBeTruthy();
    expect(component.currentStep()).toBe(1);
  });

  it('should prevent advancing past step 1 if required business fields are invalid', () => {
    expect(component.wizardForm.get('businessProfile')?.valid).toBe(false);

    component.nextStep();
    expect(component.currentStep()).toBe(1);

    const legalNameCtrl = component.wizardForm.get('businessProfile.legalName');
    expect(legalNameCtrl?.touched).toBe(true);
    expect(legalNameCtrl?.invalid).toBe(true);
  });

  it('should advance to step 2 when step 1 is valid', () => {
    component.wizardForm.get('businessProfile')?.patchValue({
      legalName: 'Test Payments Pvt Ltd',
      dbaName: 'Test Pay',
      businessType: 'PVT_LTD',
      pan: '601234567',
      ein: '601234567',
    });

    expect(component.wizardForm.get('businessProfile')?.valid).toBe(true);

    component.nextStep();
    expect(component.currentStep()).toBe(2);
  });

  it('should catch cross-field validation failure between average and high ticket size', () => {
    const processingGroup = component.wizardForm.get('processingProfile');
    processingGroup?.patchValue({
      averageTicketSize: 500,
      highTicketSize: 100,
    });

    expect(processingGroup?.hasError('ticketSizeMismatch')).toBe(true);
    expect(processingGroup?.get('highTicketSize')?.hasError('highTicketLessThanAverage')).toBe(true);
  });

  it('should render the review summary and compliance controls on step 4', () => {
    component.currentStep.set(4);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('NCHL Settlement');
    expect(text).toContain('Regulatory Attestation & Electronic Signature');
    expect(text).toContain('You must accept the terms before submitting.');
  });
});
