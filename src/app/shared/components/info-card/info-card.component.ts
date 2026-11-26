import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-info-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule],
  template: `
    <mat-card class="portal-neutral-card">
      <mat-card-header class="border-bottom pb-2 mb-3">
        <mat-card-title class="h6 fw-bold">{{ title() }}</mat-card-title>
      </mat-card-header>
      <mat-card-content class="small">
        <ng-content />
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class InfoCardComponent {
  readonly title = input.required<string>();
}
