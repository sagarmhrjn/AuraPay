import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { ApplicationTableComponent } from './application-table.component';
import { MerchantApplication } from '../../../../core/models/application.model';

const mockApplications: MerchantApplication[] = [
  {
    id: 'APP-1001',
    createdAt: '2026-03-01T09:00:00Z',
    updatedAt: '2026-03-01T09:00:00Z',
    status: 'SUBMITTED',
    salesRepId: 'sales-1',
    salesRepName: 'John Sales',
    assignedReviewerId: 'rev-1',
    assignedReviewerName: 'Jane Reviewer',
    businessProfile: {
      legalName: 'Himalayan Coffee Pvt Ltd',
      dbaName: 'Himalayan Beans',
      businessType: 'PVT_LTD',
      pan: '123456789',
      ein: '123456789',
    },
    principalProfile: {
      fullName: 'Sita Sharma',
      ownershipPercentage: 100,
      citizenshipNumber: '01-02-12345',
      ssn: '01-02-12345',
    },
    processingProfile: {
      estimatedMonthlyVolume: 500000,
      averageTicketSize: 500,
      highTicketSize: 5000,
      bankName: 'Nabil Bank',
      bankRoutingNumber: '123456789',
      bankAccountNumber: '987654321',
      currency: 'NPR',
    },
    complianceRisk: {
      termsAccepted: true,
      signerFullName: 'Sita Sharma',
      signedAt: '2026-03-01T09:00:00Z',
    },
    riskAssessment: {
      riskScore: 25,
      riskTier: 'LOW',
      decisionHistory: [],
    },
  },
];

describe('ApplicationTableComponent', () => {
  let component: ApplicationTableComponent;
  let fixture: ComponentFixture<ApplicationTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationTableComponent],
      providers: [provideRouter([]), provideHttpClient(withXhr()), provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render application data in table', () => {
    fixture.componentRef.setInput('applications', mockApplications);
    fixture.componentRef.setInput('totalItems', 1);
    fixture.componentRef.setInput('pageSize', 5);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 1);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Himalayan Coffee Pvt Ltd');
    expect(compiled.textContent).toContain('APP-1001');
    expect(compiled.textContent).toContain('John Sales');
  });

  it('should render empty state when applications array is empty and not loading', () => {
    fixture.componentRef.setInput('applications', []);
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No Applications Found');
  });

  it('should render error state and emit retry when retry button is clicked', () => {
    const retrySpy = vi.fn();
    component.retry.subscribe(retrySpy);

    fixture.componentRef.setInput('error', 'Network error');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Data Retrieval Error');
    expect(compiled.textContent).toContain('Network error');

    const retryBtn = compiled.querySelector('button[color="warn"]') as HTMLButtonElement;
    retryBtn.click();

    expect(retrySpy).toHaveBeenCalled();
  });

  it('should calculate row index correctly', () => {
    fixture.componentRef.setInput('currentPage', 2);
    fixture.componentRef.setInput('pageSize', 5);

    expect(component.getRowIndex(0)).toBe(6);
    expect(component.getRowIndex(4)).toBe(10);
  });

});
