import { Injectable, inject, signal } from '@angular/core';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { ApplicationService } from './application.service';
import { MerchantApplication } from '../models/application.model';

export type AutoSaveStatus = 'IDLE' | 'UNSAVED' | 'SAVING' | 'SAVED' | 'ERROR';

@Injectable()
export class DraftAutoSaveService {
  private readonly applicationService = inject(ApplicationService);

  readonly status = signal<AutoSaveStatus>('IDLE');
  readonly lastSavedTime = signal<Date | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly currentDraftId = signal<string | null>(null);

  private readonly saveSubject = new Subject<Partial<MerchantApplication>>();

  constructor() {
    this.initPipeline();
  }

  /** Debounces draft changes and updates save status as requests complete. */
  private initPipeline(): void {
    this.saveSubject
      .pipe(
        debounceTime(1200),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        tap(() => {
          this.status.set('SAVING');
          this.errorMessage.set(null);
        }),
        switchMap((draftData) => {
          // Keep current draft ID attached
          if (this.currentDraftId() && !draftData.id) {
            draftData.id = this.currentDraftId()!;
          }

          return this.applicationService.saveDraft(draftData).pipe(
            tap((savedApp) => {
              this.currentDraftId.set(savedApp.id);
              this.status.set('SAVED');
              this.lastSavedTime.set(new Date());
              this.errorMessage.set(null);
            }),
            catchError((err) => {
              // On error, form state is strictly preserved; error is reported
              this.status.set('ERROR');
              this.errorMessage.set(
                err?.error?.message || err?.message || 'Failed to auto-save draft. Changes preserved locally.'
              );
              // Return of(null) so the pipeline continues listening for subsequent changes
              return of(null);
            })
          );
        })
      )
      .subscribe();
  }

  /** Queues a draft for debounced persistence. */
  queueAutoSave(data: Partial<MerchantApplication>): void {
    this.status.set('UNSAVED');
    this.saveSubject.next(data);
  }

  /** Persists a draft immediately and updates the latest save state. */
  saveImmediately(data: Partial<MerchantApplication>): void {
    if (this.currentDraftId() && !data.id) {
      data.id = this.currentDraftId()!;
    }
    this.status.set('SAVING');
    this.applicationService.saveDraft(data).subscribe({
      next: (savedApp) => {
        this.currentDraftId.set(savedApp.id);
        this.status.set('SAVED');
        this.lastSavedTime.set(new Date());
        this.errorMessage.set(null);
      },
      error: (err) => {
        this.status.set('ERROR');
        this.errorMessage.set(
          err?.error?.message || err?.message || 'Failed to save draft. Changes preserved locally.'
        );
      },
    });
  }

  /** Sets the draft identifier reused by subsequent saves. */
  setDraftId(id: string | null): void {
    this.currentDraftId.set(id);
  }

  /** Resets autosave status and clears its current error message. */
  reset(): void {
    this.status.set('IDLE');
    this.errorMessage.set(null);
  }
}
