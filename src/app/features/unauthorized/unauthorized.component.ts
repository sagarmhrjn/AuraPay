import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './unauthorized.component.html'
})
export class UnauthorizedComponent {
  readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  requiredPermission = this.route.snapshot.queryParams['permission'] || null;

  /** Cycles the demo user through roles to show role-dependent access. */
  switchRolePrompt(): void {
    switch (this.authService.userRole()) {
      case 'SALES':
        this.authService.switchUserRole('REVIEWER');
        break;
      case 'REVIEWER':
        this.authService.switchUserRole('ADMIN');
        break;
      default:
        this.authService.switchUserRole('SALES');
    }
  }
}
