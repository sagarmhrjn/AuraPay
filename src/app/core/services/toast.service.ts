import { Injectable, signal } from '@angular/core';

export interface ToastNotification {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly toastsSignal = signal<ToastNotification[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  /** Adds a notification and schedules its dismissal when its duration is positive. */
  show(type: ToastNotification['type'], title: string, message: string, duration = 4500): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const toast: ToastNotification = { id, type, title, message, duration };

    this.toastsSignal.update((current) => [...current, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  /** Displays a success notification. */
  success(title: string, message: string): void {
    this.show('success', title, message);
  }

  /** Displays an error notification with the standard error duration. */
  error(title: string, message: string): void {
    this.show('danger', title, message, 6000);
  }

  /** Displays a warning notification with the standard warning duration. */
  warning(title: string, message: string): void {
    this.show('warning', title, message, 5000);
  }

  /** Displays an informational notification. */
  info(title: string, message: string): void {
    this.show('info', title, message);
  }

  /** Removes a notification by its identifier. */
  dismiss(id: string): void {
    this.toastsSignal.update((current) => current.filter((t) => t.id !== id));
  }
}
