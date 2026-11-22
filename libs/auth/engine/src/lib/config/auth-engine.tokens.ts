import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { AppAuthSettings, UserRole } from '@marxa/auth-domain';

/** White-label configuration governing auth, RBAC, request-access, and invite onboarding flows. */
export interface AuthEngineConfig extends AppAuthSettings {
  readonly appId: string;
}

/** Creates the default white-label `AuthEngineConfig`. */
export function createDefaultAuthEngineConfig(): AuthEngineConfig {
  return {
    appId: 'backoffice',
    brandName: 'Marxa Digital',
    appName: 'Backoffice Admin',
    postLoginRedirectUrl: '/stats',
    loginRoute: '/login',
    requestAccessRoute: '/request-access',
    inviteBasePath: '/invite',
    requiresProfileCompletionByDefault: false,
    defaultTargetRole: UserRole.ADMIN,
    inviteExpirationHours: 72,
    allowedAdminRoles: [UserRole.ADMIN],
  };
}

/** Injection token holding the active `AuthEngineConfig`. */
export const AUTH_ENGINE_CONFIG = new InjectionToken<AuthEngineConfig>(
  'AUTH_ENGINE_CONFIG',
  {
    providedIn: 'root',
    factory: createDefaultAuthEngineConfig,
  }
);

/** Registers custom white-label `AuthEngineConfig` overrides at the application root. */
export function provideAuthEngine(
  overrides: Partial<AuthEngineConfig>
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: AUTH_ENGINE_CONFIG,
      useValue: {
        ...createDefaultAuthEngineConfig(),
        ...overrides,
      },
    },
  ]);
}
