import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { describe, beforeEach, expect, it } from 'vitest';
import { App } from './app';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '<div>Dummy</div>',
})
class DummyComponent {}

describe('App Component', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'applications', component: DummyComponent },
          { path: 'login', component: DummyComponent },
        ]),
        provideHttpClient(withXhr()),
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should create the application root component', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the brand header and navbar on standard routes', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-toolbar')).toBeTruthy();
    expect(compiled.querySelector('app-footer')).toBeTruthy();
    expect(compiled.textContent).toContain('AuraPay');
  });

  it('should hide navbar and footer when navigating to /login', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    await router.navigateByUrl('/login');
    fixture.detectChanges();

    expect(app.isLoginPage()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-navbar')).toBeNull();
    expect(compiled.querySelector('app-footer')).toBeNull();
  });
});
