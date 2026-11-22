import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAuthEngine } from '@marxa/auth-engine';
import { UserRole } from '@secret-santa/shared-models';
import { routes } from './app.routes';
import { provideBackofficeCore } from './core/backoffice-core.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideBackofficeCore(),
    provideAuthEngine({
      appId: 'backoffice',
      brandName: 'Marxa Digital',
      appName: 'Secret Santa Backoffice',
      postLoginRedirectUrl: '/stats',
      loginRoute: '/login',
      requestAccessRoute: '/request-access',
      inviteBasePath: '/invite',
      requiresProfileCompletionByDefault: false,
      defaultTargetRole: UserRole.ADMIN,
      inviteExpirationHours: 72,
      allowedAdminRoles: [UserRole.ADMIN],
    }),
  ],
};
