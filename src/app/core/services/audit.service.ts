import { Injectable, signal } from '@angular/core';
import { SecurityAuditEvent } from '../models/audit.model';

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private readonly eventsSignal = signal<SecurityAuditEvent[]>([]);

  readonly events = this.eventsSignal.asReadonly();

  /** Adds a timestamped audit event to the top of the event log. */
  log(event: Omit<SecurityAuditEvent, 'id' | 'timestamp'>): void {
    const newEvent: SecurityAuditEvent = {
      ...event,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    this.eventsSignal.update((current) => [newEvent, ...current]);
  }

  /** Removes all stored audit events. */
  clear(): void {
    this.eventsSignal.set([]);
  }
}
