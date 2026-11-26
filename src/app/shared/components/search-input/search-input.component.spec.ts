import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { describe, beforeEach, expect, it } from 'vitest';
import { SearchInputComponent } from './search-input.component';

describe('SearchInputComponent', () => {
  let component: SearchInputComponent;
  let fixture: ComponentFixture<SearchInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchInputComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the placeholder', () => {
    fixture.componentRef.setInput('placeholder', 'Search merchant, DBA, ID...');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('mat-label');
    expect(label.textContent).toContain('Search merchant, DBA, ID...');
  });

  it('should show clear button when value is set', () => {
    fixture.componentRef.setInput('value', 'hello');
    fixture.detectChanges();
    const clearBtn = fixture.nativeElement.querySelector('button[aria-label="Clear search"]');
    expect(clearBtn).toBeTruthy();
  });

  it('should hide clear button when value is empty', () => {
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();
    const clearBtn = fixture.nativeElement.querySelector('button[aria-label="Clear search"]');
    expect(clearBtn).toBeNull();
  });

  it('should clear value and emit inputChange on clear()', () => {
    fixture.componentRef.setInput('value', 'test');
    fixture.detectChanges();

    let emitted = '';
    component.inputChange.subscribe((v) => (emitted = v));
    component.clear();

    expect(component.value()).toBe('');
    expect(emitted).toBe('');
  });
});
