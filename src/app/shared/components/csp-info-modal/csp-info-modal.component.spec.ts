import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CspInfoModalComponent } from './csp-info-modal.component';

describe('CspInfoModalComponent', () => {
  let component: CspInfoModalComponent;
  let fixture: ComponentFixture<CspInfoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CspInfoModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CspInfoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should be closed by default', () => {
    expect(component.isOpen()).toBe(false);
    const modal = fixture.nativeElement.querySelector('.modal');
    expect(modal).toBeNull();
  });

  it('should open modal when openModal is called or trigger button is clicked', () => {
    const triggerBtn = fixture.nativeElement.querySelector('.csp-trigger-btn');
    expect(triggerBtn).toBeTruthy();

    triggerBtn.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);
    const modal = fixture.nativeElement.querySelector('.modal');
    expect(modal).toBeTruthy();

    // Verify directives table and code pre block exist inside opened modal
    const directivesTable = fixture.nativeElement.querySelector('.csp-directives-table');
    expect(directivesTable).toBeTruthy();

    const codePre = fixture.nativeElement.querySelector('.csp-code-pre');
    expect(codePre).toBeTruthy();
    expect(codePre.textContent).toContain('add_header Content-Security-Policy');
  });

  it('should close modal when closeModal is called', () => {
    component.openModal();
    fixture.detectChanges();
    expect(component.isOpen()).toBe(true);

    const closeBtn = fixture.nativeElement.querySelector('.btn-close');
    expect(closeBtn).toBeTruthy();
    closeBtn.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
  });
});
