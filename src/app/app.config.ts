import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withXhr(),
      // The portal has no separate backend: the mock API serves /auth and /api
      // requests in every build (including the deployed production build) so the
      // demo accounts can sign in. Other requests pass through untouched.
      withInterceptors([authInterceptor, mockApiInterceptor])
    ),
    provideAnimationsAsync(),
  ],
};
