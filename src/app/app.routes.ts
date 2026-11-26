import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'applications',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'applications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'applications/new',
    canActivate: [authGuard, permissionGuard('CAN_CREATE_APPLICATION')],
    loadComponent: () =>
      import('./features/application-form/application-form.component').then(
        (m) => m.ApplicationFormComponent
      ),
  },
  {
    path: 'applications/:id/edit',
    canActivate: [authGuard, permissionGuard('CAN_EDIT_APPLICATION')],
    loadComponent: () =>
      import('./features/application-form/application-form.component').then(
        (m) => m.ApplicationFormComponent
      ),
  },
  {
    path: 'applications/wizard/:id',
    canActivate: [authGuard, permissionGuard('CAN_EDIT_APPLICATION')],
    loadComponent: () =>
      import('./features/application-form/application-form.component').then(
        (m) => m.ApplicationFormComponent
      ),
  },
  {
    path: 'applications/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/application-detail/application-detail.component').then(
        (m) => m.ApplicationDetailComponent
      ),
  },
  {
    path: 'security-sandbox',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/security-sandbox/security-sandbox.component').then(
        (m) => m.SecuritySandboxComponent
      ),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'applications',
  },
];
