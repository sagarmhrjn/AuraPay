import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { RiskDecisionLog } from '../../../core/models/application.model';

@Component({
  selector: 'app-application-audit-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="portal-neutral-card">
      <mat-card-header class="border-bottom pb-2 mb-3">
        <mat-card-title class="h6 fw-bold">Audit Timeline</mat-card-title>
      </mat-card-header>
      <mat-card-content class="small">
        @if (entries().length === 0) {
          <div class="text-muted text-center py-3">No decision history recorded yet.</div>
        } @else {
          <div class="d-flex flex-column gap-3">
            @for (entry of entries(); track entry.id) {
              <div class="border-start border-2 border-primary ps-3 pb-2">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <span class="badge bg-secondary-subtle text-dark border">{{ entry.action }}</span>
                  <span class="text-muted" style="font-size: 11px;">{{ entry.timestamp | date: 'short' }}</span>
                </div>
                <div class="fw-semibold text-dark">{{ entry.actorName }} ({{ entry.actorRole }})</div>
                <div class="text-secondary">{{ entry.note }}</div>
              </div>
            }
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class ApplicationAuditTimelineComponent {
  readonly entries = input.required<RiskDecisionLog[]>();
}
