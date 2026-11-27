import { Injectable, signal } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';

export interface SocketMessage<T = unknown> {
  event: string;
  data: T;
  timestamp: string;
}

export type SocketConnectionState = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  readonly connectionState = signal<SocketConnectionState>('CONNECTED');
  readonly socketId = signal<string>('sock_' + Math.random().toString(36).substring(2, 9));
  readonly eventCount = signal<number>(0);

  private readonly stream$ = new Subject<SocketMessage>();

  constructor() {
    this.startMockEventHeartbeat();
  }

  /** Returns a typed stream containing only events with the requested name. */
  on<T>(eventName: string): Observable<T> {
    return this.stream$.asObservable().pipe(
      filter((msg) => msg.event === eventName),
      map((msg) => msg.data as T)
    );
  }

  /** Publishes a socket event and increments the event counter. */
  emit<T>(eventName: string, data: T): void {
    const message: SocketMessage<T> = {
      event: eventName,
      data,
      timestamp: new Date().toISOString(),
    };
    this.eventCount.update((c) => c + 1);
    this.stream$.next(message as SocketMessage);
  }

  /** Simulates connecting the socket and transitions to connected state. */
  connect(): void {
    this.connectionState.set('CONNECTING');
    setTimeout(() => {
      this.connectionState.set('CONNECTED');
    }, 400);
  }

  /** Marks the simulated socket as disconnected. */
  disconnect(): void {
    this.connectionState.set('DISCONNECTED');
  }

  /** Toggles between connected and disconnected socket states. */
  toggleConnection(): void {
    if (this.connectionState() === 'CONNECTED') {
      this.disconnect();
    } else {
      this.connect();
    }
  }

  /**
   * Triggers an explicit simulation event for demonstration/testing
   */
  triggerSimulatedEvent(
    type: 'STATUS_CHANGED' | 'NEW_APPLICATION' | 'REVIEWER_ASSIGNED',
    appId = 'APP-2026-1001'
  ): void {
    if (this.connectionState() !== 'CONNECTED') return;

    switch (type) {
      case 'STATUS_CHANGED':
        this.emit('application:status_changed', {
          applicationId: appId,
          newStatus: 'UNDER_REVIEW',
          reviewerName: 'Jeshan Joshi',
          message: `Application ${appId} moved to UNDER_REVIEW by risk engine.`,
        });
        break;
      case 'NEW_APPLICATION':
        this.emit('application:new', {
          applicationId: `APP-2026-${Math.floor(2000 + Math.random() * 8000)}`,
          legalName: 'Apex Cloud Logistics LLC',
          salesRep: 'Sarah Jenkins',
          message: 'New merchant application submitted via merchant onboarding API.',
        });
        break;
      case 'REVIEWER_ASSIGNED':
        this.emit('application:assigned', {
          applicationId: appId,
          assignedTo: 'Jeshan Joshi',
          message: `Application ${appId} assigned to Jeshan Joshi.`,
        });
        break;
    }
  }

  /** Emits a periodic heartbeat while the simulated socket is connected. */
  private startMockEventHeartbeat(): void {
    // Subtle background simulation: periodic ping to keep connection state alive
    setInterval(() => {
      if (this.connectionState() === 'CONNECTED') {
        this.emit('heartbeat', { ping: Date.now() });
      }
    }, 30000);
  }
}
