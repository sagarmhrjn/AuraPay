import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastContainerComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  protected readonly title = signal('AuraPay Merchant Payments Portal');

  private readonly initialUrl =
    this.router.url && this.router.url !== '/'
      ? this.router.url
      : typeof window !== 'undefined'
        ? window.location.pathname
        : '';

  readonly currentUrl = signal<string>(this.initialUrl);
  readonly isLoginPage = computed(() => {
    const url = this.currentUrl();
    return url.startsWith('/login') || url.includes('/login');
  });

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
      });
  }
}
