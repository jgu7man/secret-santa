import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/create-event/create-event.component').then(
        (m) => m.CreateEventComponent
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/host-dashboard/host-dashboard.component').then(
        (m) => m.HostDashboardComponent
      ),
  },
  {
    path: 'event/:id',
    loadComponent: () =>
      import('./components/event-landing/event-landing.component').then(
        (m) => m.EventLandingComponent
      ),
  },
  {
    path: 'admin/:id/login',
    loadComponent: () =>
      import('./components/event-admin-login/event-admin-login.component').then(
        (m) => m.EventAdminLoginComponent
      ),
  },
  {
    path: 'admin/:id',
    loadComponent: () =>
      import('./components/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'event/:id/reset/:participantId',
    loadComponent: () =>
      import('./components/password-reset/password-reset.component').then(
        (m) => m.PasswordResetComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
