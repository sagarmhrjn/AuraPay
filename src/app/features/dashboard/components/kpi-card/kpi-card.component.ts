import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './kpi-card.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './kpi-card.component.scss',
})
export class KpiCardComponent {
  readonly title = input.required<string>();
  readonly count = input.required<number>();
  readonly subtitle = input<string>('');
  readonly titleClass = input<string>('text-muted');
  readonly countClass = input<string>('text-dark');
  readonly isActive = input<boolean>(false);

  readonly cardClick = output<void>();

  /** Emits the card's click event to its parent. */
  onClick(): void {
    this.cardClick.emit();
  }
}
