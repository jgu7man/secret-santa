import { Routes } from '@angular/router';
import { authGuestGuard } from '@marxa/auth-engine';

/**
 * Standard white-label authentication & onboarding routes:
 * - `login` (admin-only login, redirects already-authenticated admins)
 * - `request-access` (unindexed request access)
 * - `invite/:token` (unindexed invite acceptance)
 */
export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión',
    canActivate: [authGuestGuard],
    loadComponent: () =>
      import('./components/auth-login/auth-login.component').then(
        (m) => m.AuthLoginComponent
      ),
  },
  {
    path: 'request-access',
    title: 'Solicitar acceso',
    loadComponent: () =>
      import('./components/request-access/request-access.component').then(
        (m) => m.RequestAccessComponent
      ),
  },
  {
    path: 'invite/:token',
    title: 'Aceptar invitación',
    loadComponent: () =>
      import('./components/accept-invite/accept-invite.component').then(
        (m) => m.AcceptInviteComponent
      ),
  },
];
