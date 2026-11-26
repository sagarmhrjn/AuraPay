import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-csp-info-modal',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './csp-info-modal.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './csp-info-modal.component.scss',
})
export class CspInfoModalComponent {
  readonly isOpen = signal<boolean>(false);

  /** Opens the CSP information dialog. */
  openModal(): void {
    this.isOpen.set(true);
  }

  /** Closes the CSP information dialog. */
  closeModal(): void {
    this.isOpen.set(false);
  }
}
