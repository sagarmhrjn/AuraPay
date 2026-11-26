import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { describe, beforeEach, expect, it } from 'vitest';
import { SensitiveRevealComponent } from './sensitive-reveal.component';
import { AuthService } from '../../../core/services/auth.service';
import { AuditService } from '../../../core/services/audit.service';
import { ToastService } from '../../../core/services/toast.service';

describe('SensitiveRevealComponent', () => {
  let component: SensitiveRevealComponent;
  let fixture: ComponentFixture<SensitiveRevealComponent>;
  let authService: AuthService;
  let auditService: AuditService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SensitiveRevealComponent],
      providers: [
        AuthService,
        AuditService,
        ToastService,
        provideHttpClient(withXhr()),
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SensitiveRevealComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    auditService = TestBed.inject(AuditService);

    fixture.componentRef.setInput('rawValue', '123-45-6789');
    fixture.componentRef.setInput('fieldType', 'SSN');
    fixture.componentRef.setInput('fieldName', 'Principal SSN');
    fixture.componentRef.setInput('applicationId', 'APP-2026-1001');

    fixture.detectChanges();
  });

  it('should display masked value by default', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('•••-••-6789');
    expect(text).not.toContain('123-45-6789');
    expect(component.isRevealed()).toBe(false);
  });

  it('should DENY reveal attempt when active user is SALES', () => {
    authService.switchUserRole('SALES');
    component.attemptReveal();
    fixture.detectChanges();

    expect(component.isRevealed()).toBe(false);
    expect(component.accessDeniedMessage()).toContain('Access Denied');

    // Value must remain masked
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('•••-••-6789');
    expect(text).not.toContain('123-45-6789');

    // Audit event must be logged
    const logs = auditService.events();
    expect(logs.some((l) => l.action === 'SENSITIVE_FIELD_REVEAL_DENIED')).toBe(true);
  });

  it('should ALLOW reveal when active user is REVIEWER or ADMIN', () => {
    authService.switchUserRole('REVIEWER');
    component.attemptReveal();
    fixture.detectChanges();

    expect(component.isRevealed()).toBe(true);
    expect(component.accessDeniedMessage()).toBeNull();

    // Value must be unmasked
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('123-45-6789');

    // Audit event must be logged
    const logs = auditService.events();
    expect(logs.some((l) => l.action === 'SENSITIVE_FIELD_REVEAL')).toBe(true);

    // Clicking hide re-masks
    component.hide();
    fixture.detectChanges();
    expect(component.isRevealed()).toBe(false);
  });
});
