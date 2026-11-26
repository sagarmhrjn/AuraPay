import { ChangeDetectionStrategy, Component, OnDestroy, inject, input, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../../core/services/auth.service';
import { AuditService } from '../../../core/services/audit.service';
import { ToastService } from '../../../core/services/toast.service';
import { MaskSensitivePipe } from '../../pipes/mask.pipe';

@Component({
  selector: 'app-sensitive-reveal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatChipsModule, MaskSensitivePipe],
  templateUrl: './sensitive-reveal.component.html',
  styleUrl: './sensitive-reveal.component.scss',
})
export class SensitiveRevealComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly auditService = inject(AuditService);
  private readonly toast = inject(ToastService);

  readonly rawValue = input.required<string>();
  readonly fieldType = input<'PAN' | 'CITIZENSHIP' | 'SSN' | 'BANK_ACCOUNT' | 'EIN' | 'CARD' | 'GENERIC'>('GENERIC');
  readonly fieldName = input<string>('Sensitive Data');
  readonly applicationId = input<string | undefined>(undefined);
  readonly allowContextualReveal = input(false);

  readonly isRevealed = signal<boolean>(false);
  readonly accessDeniedMessage = signal<string | null>(null);
  readonly remainingSeconds = signal<number>(30);

  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  /** Checks reveal permission, records the attempt, and unmasks authorized data. */
  attemptReveal(): void {
    const user = this.authService.currentUser();
    const hasPermission =
      this.authService.hasPermission('CAN_REVEAL_SENSITIVE_DATA') || this.allowContextualReveal();

    if (!hasPermission) {
      const userRole = user?.role ?? 'ANONYMOUS';
      const deniedMsg = `Access Denied: Role [${userRole}] cannot view unmasked ${this.fieldName()} per Nepal Rastra Bank (NRB) AML/CFT security policy.`;
      this.accessDeniedMessage.set(deniedMsg);
      this.toast.error('Permission Denied', deniedMsg);

      this.auditService.log({
        userId: user?.id ?? 'anonymous',
        userName: user?.name ?? 'System',
        userRole: userRole,
        action: 'SENSITIVE_FIELD_REVEAL_DENIED',
        applicationId: this.applicationId(),
        fieldName: this.fieldName(),
        details: `Unauthorized attempt to unmask ${this.fieldName()} on application ${this.applicationId() || 'N/A'}`,
      });

      setTimeout(() => this.accessDeniedMessage.set(null), 5000);
      return;
    }

    this.accessDeniedMessage.set(null);
    this.isRevealed.set(true);
    this.remainingSeconds.set(30);

    this.auditService.log({
      userId: user?.id ?? 'anonymous',
      userName: user?.name ?? 'System',
      userRole: user?.role ?? 'UNKNOWN',
      action: 'SENSITIVE_FIELD_REVEAL',
      applicationId: this.applicationId(),
      fieldName: this.fieldName(),
      details: `Authorized unmasking of ${this.fieldName()} on application ${this.applicationId() || 'N/A'}. 30s auto-remask active.`,
    });

    this.startAutoRemaskTimer();
  }

  /** Remasks the sensitive value and stops its countdown timer. */
  hide(): void {
    this.isRevealed.set(false);
    this.clearTimer();
  }

  /** Starts the countdown that automatically remasks sensitive data. */
  private startAutoRemaskTimer(): void {
    this.clearTimer();
    this.countdownTimer = setInterval(() => {
      const current = this.remainingSeconds();
      if (current <= 1) {
        this.hide();
      } else {
        this.remainingSeconds.set(current - 1);
      }
    }, 1000);
  }

  /** Stops and clears the active remasking countdown timer. */
  private clearTimer(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  /** Clears the countdown timer when the component is destroyed. */
  ngOnDestroy(): void {
    this.clearTimer();
  }
}
