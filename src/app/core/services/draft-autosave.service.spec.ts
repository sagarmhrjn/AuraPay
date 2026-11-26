import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { DraftAutoSaveService } from './draft-autosave.service';
import { ApplicationService } from './application.service';
import { MerchantApplication } from '../models/application.model';

describe('DraftAutoSaveService', () => {
  let service: DraftAutoSaveService;
  let applicationServiceMock: { saveDraft: ReturnType<typeof vi.fn> };

  const sampleDraft: Partial<MerchantApplication> = {
    id: 'APP-DRAFT-123',
    businessProfile: { legalName: 'Draft Co LLC' } as any,
  };

  beforeEach(() => {
    vi.useFakeTimers();

    applicationServiceMock = {
      saveDraft: vi.fn().mockReturnValue(of({ ...sampleDraft, id: 'APP-DRAFT-123' })),
    };

    TestBed.configureTestingModule({
      providers: [
        DraftAutoSaveService,
        { provide: ApplicationService, useValue: applicationServiceMock },
      ],
    });

    service = TestBed.inject(DraftAutoSaveService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with IDLE status', () => {
    expect(service.status()).toBe('IDLE');
    expect(service.lastSavedTime()).toBeNull();
    expect(service.errorMessage()).toBeNull();
  });

  it('should debounce auto-save calls and transition status to SAVED', () => {
    service.queueAutoSave(sampleDraft);
    expect(service.status()).toBe('UNSAVED');

    // Before debounce elapsed (1200ms debounce)
    vi.advanceTimersByTime(500);
    expect(applicationServiceMock.saveDraft).not.toHaveBeenCalled();

    // Complete debounce period
    vi.advanceTimersByTime(800);
    expect(applicationServiceMock.saveDraft).toHaveBeenCalledWith(sampleDraft);
    expect(service.status()).toBe('SAVED');
    expect(service.lastSavedTime()).toBeInstanceOf(Date);
    expect(service.currentDraftId()).toBe('APP-DRAFT-123');
  });

  it('should handle save error gracefully without throwing or losing state', () => {
    applicationServiceMock.saveDraft.mockReturnValue(
      throwError(() => ({ message: 'Network Timeout' }))
    );

    service.queueAutoSave(sampleDraft);
    vi.advanceTimersByTime(1300);

    expect(service.status()).toBe('ERROR');
    expect(service.errorMessage()).toContain('Network Timeout');
  });

  it('should save immediately when saveImmediately is invoked', () => {
    service.saveImmediately(sampleDraft);

    expect(applicationServiceMock.saveDraft).toHaveBeenCalledWith(sampleDraft);
    expect(service.status()).toBe('SAVED');
  });
});
