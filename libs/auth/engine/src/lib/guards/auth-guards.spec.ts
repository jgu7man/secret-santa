import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { FIRESTORE_DB } from '@secret-santa/shared-firebase';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { createDefaultAuthEngineConfig } from '../config/auth-engine.tokens';
import { AuthSessionStatus } from '../models/access-onboarding.model';
import { AuthRuntimeConfigService } from '../services/auth-runtime-config.service';
import { AuthSessionService } from '../services/auth-session.service';
import { authAdminGuard } from './auth-admin.guard';
import { authGuestGuard } from './auth-guest.guard';

describe('auth route guards', () => {
  const authSessionSpy = {
    verifyOrLogoutAdmin: jasmine.createSpy('verifyOrLogoutAdmin'),
  };

  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = {} as RouterStateSnapshot;

  beforeEach(() => {
    authSessionSpy.verifyOrLogoutAdmin.calls.reset();

    const app = initializeApp(
      {
        projectId: 'demo-test',
        apiKey: 'test-api-key',
        appId: '1:1:web:test',
      },
      `auth-guards-spec-${Math.random()}`
    );

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: FIRESTORE_DB, useValue: getFirestore(app) },
        { provide: AuthSessionService, useValue: authSessionSpy },
      ],
    });

    const runtimeConfig = TestBed.inject(AuthRuntimeConfigService);
    runtimeConfig.applyRuntimeAuth({
      ...createDefaultAuthEngineConfig(),
      loginRoute: '/custom-login',
      postLoginRedirectUrl: '/custom-home',
    });
  });

  it('should allow access to protected admin routes for authorized sessions', async () => {
    authSessionSpy.verifyOrLogoutAdmin.and.resolveTo(
      AuthSessionStatus.AUTHORIZED
    );

    const result = await TestBed.runInInjectionContext(() =>
      authAdminGuard(dummyRoute, dummyState)
    );

    expect(result).toBeTrue();
  });

  it('should redirect unauthenticated visitors to the configured login route', async () => {
    authSessionSpy.verifyOrLogoutAdmin.and.resolveTo(
      AuthSessionStatus.UNAUTHENTICATED
    );

    const result = await TestBed.runInInjectionContext(() =>
      authAdminGuard(dummyRoute, dummyState)
    );

    const router = TestBed.inject(Router);
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/custom-login');
  });

  it('should redirect unauthorized signed-in users to login with an unauthorized reason notice', async () => {
    authSessionSpy.verifyOrLogoutAdmin.and.resolveTo(
      AuthSessionStatus.UNAUTHORIZED
    );

    const result = await TestBed.runInInjectionContext(() =>
      authAdminGuard(dummyRoute, dummyState)
    );

    const router = TestBed.inject(Router);
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/custom-login?reason=unauthorized'
    );
  });

  it('should skip the login screen and send already-authorized admins straight to the app home', async () => {
    authSessionSpy.verifyOrLogoutAdmin.and.resolveTo(
      AuthSessionStatus.AUTHORIZED
    );

    const result = await TestBed.runInInjectionContext(() =>
      authGuestGuard(dummyRoute, dummyState)
    );

    const router = TestBed.inject(Router);
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/custom-home');
  });

  it('should allow unauthenticated visitors to view the login screen', async () => {
    authSessionSpy.verifyOrLogoutAdmin.and.resolveTo(
      AuthSessionStatus.UNAUTHENTICATED
    );

    const result = await TestBed.runInInjectionContext(() =>
      authGuestGuard(dummyRoute, dummyState)
    );

    expect(result).toBeTrue();
  });
});
