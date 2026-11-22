import { TestBed } from '@angular/core/testing';
import { UserRole } from '@marxa/auth-domain';
import { FIRESTORE_DB } from '@secret-santa/shared-firebase';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { provideAuthEngine } from '../config/auth-engine.tokens';
import { AuthRuntimeConfigService } from './auth-runtime-config.service';

describe('AuthRuntimeConfigService', () => {
  beforeEach(() => {
    const app = initializeApp(
      {
        projectId: 'demo-test',
        apiKey: 'test-api-key',
        appId: '1:1:web:test',
      },
      `runtime-config-spec-${Math.random()}`,
    );

    TestBed.configureTestingModule({
      providers: [
        provideAuthEngine({
          appId: 'backoffice',
          brandName: 'Marxa Boot',
          postLoginRedirectUrl: '/stats',
        }),
        { provide: FIRESTORE_DB, useValue: getFirestore(app) },
      ],
    });
  });

  it('should preserve boot fallback settings before Firestore overrides are applied', () => {
    const service = TestBed.inject(AuthRuntimeConfigService);

    expect(service.config().appId).toBe('backoffice');
    expect(service.config().brandName).toBe('Marxa Boot');
    expect(service.config().postLoginRedirectUrl).toBe('/stats');
  });

  it('should apply updated runtime auth settings immediately without losing appId', () => {
    const service = TestBed.inject(AuthRuntimeConfigService);

    service.applyRuntimeAuth({
      brandName: 'Marxa Cloud',
      appName: 'Dynamic Admin',
      postLoginRedirectUrl: '/crew',
      loginRoute: '/signin',
      requestAccessRoute: '/ask-access',
      inviteBasePath: '/join',
      requiresProfileCompletionByDefault: true,
      defaultTargetRole: UserRole.HOST,
      inviteExpirationHours: 24,
      allowedAdminRoles: [UserRole.ADMIN, UserRole.HOST],
    });

    expect(service.config().appId).toBe('backoffice');
    expect(service.config().brandName).toBe('Marxa Cloud');
    expect(service.config().postLoginRedirectUrl).toBe('/crew');
    expect(service.config().allowedAdminRoles).toEqual([
      UserRole.ADMIN,
      UserRole.HOST,
    ]);
  });
});
