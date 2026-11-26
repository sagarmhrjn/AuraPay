import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { KpiCardComponent } from './kpi-card.component';

describe('KpiCardComponent', () => {
  let component: KpiCardComponent;
  let fixture: ComponentFixture<KpiCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiCardComponent, MatCardModule],
    }).compileComponents();

    fixture = TestBed.createComponent(KpiCardComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.componentRef.setInput('title', 'Total');
    fixture.componentRef.setInput('count', 42);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render title, count, and subtitle', () => {
    fixture.componentRef.setInput('title', 'Under Review');
    fixture.componentRef.setInput('count', 12);
    fixture.componentRef.setInput('subtitle', 'Awaiting decision');
    fixture.componentRef.setInput('titleClass', 'text-primary');
    fixture.componentRef.setInput('countClass', 'text-primary');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Under Review');
    expect(compiled.textContent).toContain('12');
    expect(compiled.textContent).toContain('Awaiting decision');
  });

  it('should apply active-filter class when isActive is true', () => {
    fixture.componentRef.setInput('title', 'Approved');
    fixture.componentRef.setInput('count', 8);
    fixture.componentRef.setInput('isActive', true);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.status-kpi-card');
    expect(card.classList.contains('active-filter')).toBe(true);
  });

  it('should emit cardClick event when card is clicked', () => {
    fixture.componentRef.setInput('title', 'Submitted');
    fixture.componentRef.setInput('count', 5);
    fixture.detectChanges();

    let clicked = false;
    component.cardClick.subscribe(() => (clicked = true));

    const card = fixture.nativeElement.querySelector('.status-kpi-card');
    card.click();

    expect(clicked).toBe(true);
  });
});
