import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { describe, beforeEach, expect, it } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withXhr()),
        provideAnimationsAsync(),
        ApplicationService,
        AuthService,
        SocketService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);

    fixture.detectChanges();
  });

  it('should initialize and display dashboard title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Dashboard');
  });

  it('should display KPI status cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Under Review');
    expect(compiled.textContent).toContain('Action Req');
    expect(compiled.textContent).toContain('Approved');
  });

  it('should render New Application button for SALES persona', () => {
    authService.switchUserRole('SALES');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('New Merchant Application');
  });

  it('should HIDE New Application button for REVIEWER persona', () => {
    authService.switchUserRole('REVIEWER');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('New Merchant Application');
  });

  it('should filter applications by status when filterByStatus is called', () => {
    component.filterByStatus('UNDER_REVIEW');
    expect(component.selectedStatus).toBe('UNDER_REVIEW');
  });

  it('should filter applications when clicking on an app-kpi-card', () => {
    const kpiCards = fixture.nativeElement.querySelectorAll('app-kpi-card');
    expect(kpiCards.length).toBe(6);
    const underReviewCard = kpiCards[1].querySelector('.status-kpi-card') as HTMLElement;
    underReviewCard.click();
    fixture.detectChanges();
    expect(component.selectedStatus).toBe('UNDER_REVIEW');
  });
});
