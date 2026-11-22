import { Routes } from '@angular/router';
import { authAdminGuard } from '@marxa/auth-engine';
import { AUTH_ROUTES } from '@marxa/auth-ui';

export const routes: Routes = [
  ...AUTH_ROUTES,
  {
    path: '',
    canActivate: [authAdminGuard],
    loadComponent: () =>
      import('./components/backoffice-shell/backoffice-shell.component').then(
        (m) => m.BackofficeShellComponent
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'stats',
      },
      {
        path: 'stats',
        title: 'Estadísticas — Backoffice',
        loadComponent: () =>
          import('./components/stats-dashboard/stats-dashboard.component').then(
            (m) => m.StatsDashboardComponent
          ),
      },
      {
        path: 'users',
        title: 'Crew y Accesos — Backoffice',
        loadChildren: () =>
          import('@marxa/crew-ui').then((m) => m.CrewUiModule),
      },
      {
        path: 'settings',
        title: 'Configuraciones — Backoffice',
        loadComponent: () =>
          import('./components/settings-manager/settings-manager.component').then(
            (m) => m.SettingsManagerComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
