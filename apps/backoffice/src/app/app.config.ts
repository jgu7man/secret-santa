import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { UserRole } from '@marxa/auth-domain';
import { provideAuthEngine } from '@marxa/auth-engine';
import {
  BuyMeACoffeeWidgetPosition,
  DEFAULT_FOOTER_SETTINGS,
  createDefaultAppRegistryDocument,
  provideAppRegistryDefaults,
} from '@secret-santa/shared-data-access';
import { routes } from './app.routes';
import { provideBackofficeCore } from './core/backoffice-core.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideBackofficeCore(),
    provideAppRegistryDefaults({
      backoffice: createDefaultAppRegistryDocument('backoffice', {
        name: 'Secret Santa Backoffice',
        maintenanceMessage:
          'Estamos realizando mejoras programadas. Vuelve en unos minutos.',
        auth: {
          appName: 'Secret Santa Backoffice',
          postLoginRedirectUrl: '/stats',
          defaultTargetRole: UserRole.ADMIN,
        },
      }),
      'secret-santa': createDefaultAppRegistryDocument('secret-santa', {
        name: 'Secret Santa',
        maintenanceMessage:
          'Estamos realizando mejoras programadas. Vuelve en unos minutos.',
        buyMeACoffee: {
          enabled: true,
          slug: 'jgu7man',
          color: '#40DCA5',
          position: BuyMeACoffeeWidgetPosition.RIGHT,
          xMargin: 18,
          yMargin: 18,
        },
        footer: {
          ...DEFAULT_FOOTER_SETTINGS,
        },
        auth: {
          appName: 'Secret Santa',
          postLoginRedirectUrl: '/dashboard',
          defaultTargetRole: UserRole.HOST,
        },
      }),
    }),
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
