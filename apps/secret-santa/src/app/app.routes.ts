import { Routes } from '@angular/router';
import { SeoRouteKey, adminGuard, hostGuard } from './core';

export const routes: Routes = [
  {
    path: '',
    data: { seoKey: SeoRouteKey.HOME },
    loadComponent: () =>
      import('./components/create-event/create-event.component').then(
        (m) => m.CreateEventComponent
      ),
  },
  {
    path: 'login',
    data: { seoKey: SeoRouteKey.LOGIN },
    loadComponent: () =>
      import('./components/host-login/host-login.component').then(
        (m) => m.HostLoginComponent
      ),
  },
  {
    path: 'dashboard',
    data: { seoKey: SeoRouteKey.DASHBOARD },
    loadComponent: () =>
      import('./components/host-dashboard/host-dashboard.component').then(
        (m) => m.HostDashboardComponent
      ),
    canActivate: [hostGuard],
  },
  {
    path: 'event/:id',
    data: { seoKey: SeoRouteKey.EVENT_LANDING },
    loadComponent: () =>
      import('./components/event-landing/event-landing.component').then(
        (m) => m.EventLandingComponent
      ),
  },
  {
    path: 'admin/:id/login',
    data: { seoKey: SeoRouteKey.ADMIN_LOGIN },
    loadComponent: () =>
      import('./components/event-admin-login/event-admin-login.component').then(
        (m) => m.EventAdminLoginComponent
      ),
  },
  {
    path: 'admin/:id',
    data: { seoKey: SeoRouteKey.ADMIN_DASHBOARD },
    loadComponent: () =>
      import('./components/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'event/:id/reset/:participantId',
    data: { seoKey: SeoRouteKey.PASSWORD_RESET },
    loadComponent: () =>
      import('./components/password-reset/password-reset.component').then(
        (m) => m.PasswordResetComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
