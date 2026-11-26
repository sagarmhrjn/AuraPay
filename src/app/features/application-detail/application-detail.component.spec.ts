import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { ApplicationDetailComponent } from './application-detail.component';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import { INITIAL_MOCK_APPLICATIONS } from '../../core/services/mock-data';
import { RiskDecisionLog } from '../../core/models/application.model';

describe('ApplicationDetailComponent', () => {
  let component: ApplicationDetailComponent;
  let fixture: ComponentFixture<ApplicationDetailComponent>;
  let authService: AuthService;
  let applicationService: ApplicationService;

  const sampleApp = INITIAL_MOCK_APPLICATIONS[0]; // APP-2026-1001

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationDetailComponent],
      providers: [
        provideRouter([{ path: 'unauthorized', component: class {} }]),
        provideHttpClient(withXhr()),
        provideAnimationsAsync(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'APP-2026-1001' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationDetailComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    applicationService = TestBed.inject(ApplicationService);

    authService.switchUserRole('SALES');
    vi.spyOn(applicationService, 'getApplication').mockReturnValue(of(sampleApp));
  });

  it('should load and render the application profile for SALES', () => {
    fixture.detectChanges();

    expect(component.application()).toEqual(sampleApp);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Himalayan Cloud Logistics Pvt. Ltd.');
    expect(compiled.textContent).toContain('APP-2026-1001');
    expect(compiled.querySelector('.col-lg-12')).toBeTruthy();
    expect(compiled.textContent).not.toContain('Underwriting Decision');
    expect(compiled.textContent).not.toContain('Audit Timeline');
  });

  it('should DISPLAY underwriting decision controls when user has CAN_RECORD_RISK_DECISION (REVIEWER)', () => {
    authService.switchUserRole('REVIEWER');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Underwriting Decision');
    expect(compiled.textContent).toContain('Record APPROVE Decision');
    expect(compiled.textContent).toContain('Audit Timeline');
  });

  it('should hide underwriting decisions and audit timeline from SALES users', () => {
    authService.switchUserRole('SALES');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Underwriting Decision');
    expect(compiled.textContent).not.toContain('Underwriting Controls Restricted');
    expect(compiled.textContent).not.toContain('Audit Timeline');
  });

  it('allows SALES to reveal sensitive values on applications they can edit', () => {
    const editableApplication = { ...sampleApp, status: 'DRAFT' as const };
    vi.mocked(applicationService.getApplication).mockReturnValue(of(editableApplication));
    fixture.detectChanges();

    const revealButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.reveal-action-btn'
    );
    revealButton?.click();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      editableApplication.businessProfile.pan
    );
  });

  it('keeps sensitive values masked for SALES on applications they cannot edit', () => {
    fixture.detectChanges();

    const revealButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.reveal-action-btn'
    );
    revealButton?.click();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Access Denied');
    expect(text).not.toContain(sampleApp.businessProfile.pan);
  });

  it('should keep the selected decision action in sync with the decision panel', () => {
    authService.switchUserRole('REVIEWER');
    fixture.detectChanges();

    const requestInfoButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent?.includes('Request Info'));
    requestInfoButton?.click();
    fixture.detectChanges();

    expect(component.decisionAction).toBe('REQUEST_INFO');
  });

  it('should immediately render decision history when the API returns the same mutated application reference', () => {
    authService.switchUserRole('REVIEWER');
    const applicationState = {
      ...sampleApp,
      riskAssessment: {
        ...sampleApp.riskAssessment,
        decisionHistory: [...sampleApp.riskAssessment.decisionHistory],
      },
    };
    vi.mocked(applicationService.getApplication).mockReturnValue(of(applicationState));
    fixture.detectChanges();

    const currentApplication = component.application()!;
    const previousReference = currentApplication;
    const decisionLog: RiskDecisionLog = {
      id: 'log-status-change',
      timestamp: new Date().toISOString(),
      actorId: 'usr-rev-02',
      actorName: 'Jeshan Joshi',
      actorRole: 'REVIEWER',
      action: 'APPROVED',
      previousStatus: currentApplication.status,
      newStatus: 'APPROVED',
      note: 'Approved during review.',
    };

    vi.spyOn(applicationService, 'recordRiskDecision').mockImplementation(() => {
      currentApplication.status = 'APPROVED';
      currentApplication.riskAssessment.decisionHistory.push(decisionLog);
      return of(currentApplication);
    });

    component.decisionNote = decisionLog.note;
    component.submitDecision();

    expect(component.application()).not.toBe(previousReference);
    expect(component.application()?.riskAssessment.decisionHistory.at(-1)).toEqual(decisionLog);

    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Approved during review.');
  });

  it('should open the assignment dialog and assign the selected reviewer', () => {
    authService.switchUserRole('ADMIN');
    const updatedApp = {
      ...sampleApp,
      assignedReviewerId: 'usr-rev-01',
      assignedReviewerName: 'Pradeep Adhikari',
    };
    const assignReviewerSpy = vi
      .spyOn(applicationService, 'assignReviewer')
      .mockReturnValue(of(updatedApp));

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const openButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find((button) => {
      const text = button.textContent ?? '';
      return text.includes('Assign') && !text.includes('Reviewer');
    });
    openButton?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('[role="dialog"]')).toBeTruthy();

    const confirmButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.trim() === 'Assign Reviewer');
    confirmButton?.click();
    fixture.detectChanges();

    expect(assignReviewerSpy).toHaveBeenCalledWith(
      sampleApp.id,
      'usr-rev-01',
      'Pradeep Adhikari'
    );
    expect(component.application()).toEqual(updatedApp);
    expect(compiled.querySelector('[role="dialog"]')).toBeNull();
  });
});
