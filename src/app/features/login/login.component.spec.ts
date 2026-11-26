import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Router } from '@angular/router';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([{ path: 'applications', component: class {} }]),
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        AuthService,
        ToastService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should initialize with an invalid empty form', () => {
    expect(component.loginForm.valid).toBe(false);
    expect(component.loginForm.get('email')?.valid).toBe(false);
    expect(component.loginForm.get('password')?.valid).toBe(false);
  });

  it('should toggle password visibility on demand', () => {
    expect(component.hidePassword()).toBe(true);
    component.togglePasswordVisibility();
    expect(component.hidePassword()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.hidePassword()).toBe(true);
  });

  it('should populate credentials and submit on quickLogin', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');

    component.quickLogin('SALES');

    const req = httpMock.expectOne('/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.email).toContain('aayush.shrestha@aurapay.np');

    req.flush({
      user: {
        id: 'usr-sales-01',
        name: 'Aayush Shrestha',
        email: 'aayush.shrestha@aurapay.np',
        role: 'SALES',
      },
      tokens: {
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    });

    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.currentUser()?.id).toBe('usr-sales-01');
    expect(navigateSpy).toHaveBeenCalledWith('/applications');
  });

  it('should display error message when login fails', () => {
    component.loginForm.patchValue({
      email: 'invalid@aurapay.np',
      password: 'wrongpassword',
    });

    component.onSubmit();

    const req = httpMock.expectOne('/auth/login');
    req.flush(
      { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(component.errorMessage()).toBe('Invalid email or password');
    expect(component.loading()).toBe(false);
  });
});
