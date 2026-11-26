import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { ToastService } from '../../core/services/toast.service';
import { CspInfoModalComponent } from '../../shared/components/csp-info-modal/csp-info-modal.component';
import { UserRole } from '../../core/constants/auth.const';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    CspInfoModalComponent,
  ],
  templateUrl: './navbar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
  readonly socketService = inject(SocketService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Switches the active demo persona and notifies the user. */
  selectRole(role: UserRole): void {
    this.authService.switchUserRole(role);
    const user = this.authService.currentUser();
    this.toast.info('Role Switched', `Active user is now: ${user?.name} (${role})`);
  }

  /** Ends the active session and navigates to the login page. */
  logout(): void {
    this.authService.logout();
    this.toast.info('Signed Out', 'You have been successfully signed out of AuraPay.');
    this.router.navigate(['/login']);
  }

  /** Toggles the real-time connection and reports its new state. */
  toggleSocket(): void {
    this.socketService.toggleConnection();
    const state = this.socketService.connectionState();
    if (state === 'CONNECTED') {
      this.toast.success('Socket.IO', 'Real-time WebSocket stream connected.');
    } else {
      this.toast.warning('Socket.IO', 'Real-time WebSocket stream paused.');
    }
  }

  /** Returns the CSS class used to distinguish the active user role. */
  getRoleBadgeClass(role: UserRole | null): string {
    switch (role) {
      case 'SALES':
        return 'bg-warning text-dark';
      case 'REVIEWER':
        return 'bg-primary text-white';
      case 'ADMIN':
        return 'bg-danger text-white';
      default:
        return 'bg-secondary text-white';
    }
  }
}
