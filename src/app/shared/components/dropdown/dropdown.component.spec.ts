import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { DropdownComponent } from './dropdown.component';
import { DropdownOption } from './dropdown.model';

const mockOptions: DropdownOption<string>[] = [
  { value: 'ALL', label: 'All Items' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive', disabled: true },
];

describe('DropdownComponent', () => {
  let component: DropdownComponent<string>;
  let fixture: ComponentFixture<DropdownComponent<string>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownComponent<string>);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('label', 'Test Label');
    fixture.componentRef.setInput('options', mockOptions);
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should display label in mat-label', () => {
    fixture.componentRef.setInput('label', 'Filter Status');
    fixture.componentRef.setInput('options', mockOptions);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Filter Status');
  });

  it('should emit selectionChange and update model value when selection changes', () => {
    fixture.componentRef.setInput('label', 'Status');
    fixture.componentRef.setInput('options', mockOptions);
    fixture.componentRef.setInput('value', 'ALL');
    fixture.detectChanges();

    const spy = vi.fn();
    component.selectionChange.subscribe(spy);

    component.onSelectionChange('ACTIVE');

    expect(component.value()).toBe('ACTIVE');
    expect(spy).toHaveBeenCalledWith('ACTIVE');
  });
});
