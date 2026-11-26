import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { getDefaultMockUser, MOCK_USERS } from '../../core/services/mock-data';
import { UserRole } from '../../core/constants/auth.const';

export interface DemoPersona {
  role: UserRole;
  name: string;
  email: string;
  title: string;
  badgeClass: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule
],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly loading = signal<boolean>(false);
  readonly hidePassword = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly demoPersonas: DemoPersona[] = [
    {
      role: 'SALES',
      name: MOCK_USERS.SALES[0].name,
      email: MOCK_USERS.SALES[0].email,
      title: MOCK_USERS.SALES[0].title,
      badgeClass: 'bg-warning text-dark',
      icon: 'badge',
      description: 'Create merchant applications, draft auto-saving, manage own submissions.',
    },
    {
      role: 'REVIEWER',
      name: MOCK_USERS.REVIEWER[0].name,
      email: MOCK_USERS.REVIEWER[0].email,
      title: MOCK_USERS.REVIEWER[0].title,
      badgeClass: 'bg-primary text-white',
      icon: 'rate_review',
      description: 'Underwrite risk scores, NRB compliance evaluation, approve/reject merchants.',
    },
    {
      role: 'ADMIN',
      name: MOCK_USERS.ADMIN.name,
      email: MOCK_USERS.ADMIN.email,
      title: MOCK_USERS.ADMIN.title,
      badgeClass: 'bg-danger text-white',
      icon: 'admin_panel_settings',
      description: 'Full portal governance, manage reviewer assignments, view all merchants.',
    },
  ];

  readonly loginForm = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required, Validators.minLength(4)]),
    rememberMe: new FormControl(true),
  });

  /** Redirects users with an active session to the applications dashboard. */
  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/applications']);
    }
  }

  /** Toggles whether the password input is masked. */
  togglePasswordVisibility(): void {
    this.hidePassword.update((val) => !val);
  }

  /** Fills the login form with a demo persona and submits it. */
  quickLogin(role: UserRole): void {
    const persona = getDefaultMockUser(role);
    this.loginForm.patchValue({
      email: persona.email,
      password: 'Password123!',
      rememberMe: true,
    });
    this.onSubmit();
  }

  /** Validates credentials, authenticates the user, and routes on success. */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password, rememberMe } = this.loginForm.getRawValue();

    this.authService
      .login({
        email: email ?? '',
        password: password ?? '',
        rememberMe: rememberMe ?? true,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.toast.success(
            'Sign In Successful',
            `Welcome back, ${res.user.name} (${res.user.role})!`
          );
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/applications';
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(
            err?.error?.message ||
              'Authentication failed. Please verify your email and password.'
          );
        },
      });
  }
}
