import { TestBed } from '@angular/core/testing';
import { AuthService } from '@secret-santa/shared-core';
import { UserProfileService } from '@secret-santa/shared-firebase';
import { UserRole, UserStatus } from '@secret-santa/shared-models';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { AuthSessionStatus } from '../models/access-onboarding.model';
import { createDefaultAuthEngineConfig } from '../config/auth-engine.tokens';
import { AuthRuntimeConfigService } from './auth-runtime-config.service';
import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService', () => {
  const authSpy = {
    waitForAuthReady: jasmine.createSpy('waitForAuthReady'),
    logout: jasmine.createSpy('logout').and.resolveTo(),
  };

  const profileSpy = {
    getUserByUid: jasmine.createSpy('getUserByUid'),
  };

  beforeEach(() => {
    authSpy.waitForAuthReady.calls.reset();
    authSpy.logout.calls.reset();
    profileSpy.getUserByUid.calls.reset();

    TestBed.configureTestingModule({
      providers: [
        AuthSessionService,
        { provide: AuthService, useValue: authSpy },
        { provide: UserProfileService, useValue: profileSpy },
      ],
    });
  });

  it('should identify a visitor without an active session as unauthenticated without forcing a sign-out', async () => {
    authSpy.waitForAuthReady.and.resolveTo(null);
    const service = TestBed.inject(AuthSessionService);

    expect(await service.verifyOrLogoutAdmin()).toBe(
      AuthSessionStatus.UNAUTHENTICATED
    );
    expect(authSpy.logout).not.toHaveBeenCalled();
  });

  it('should grant admin panel access to an active user whose role is authorized for the app', async () => {
    authSpy.waitForAuthReady.and.resolveTo({ uid: 'a-1' } as User);
    profileSpy.getUserByUid.and.resolveTo({
      uid: 'a-1',
      email: 'admin@example.com',
      displayName: 'Admin',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
    });

    const service = TestBed.inject(AuthSessionService);
    expect(await service.verifyOrLogoutAdmin()).toBe(
      AuthSessionStatus.AUTHORIZED
    );
    expect(authSpy.logout).not.toHaveBeenCalled();
  });

  it('should automatically sign out an authenticated user who lacks administrative privileges', async () => {
    authSpy.waitForAuthReady.and.resolveTo({ uid: 'u-1' } as User);
    profileSpy.getUserByUid.and.resolveTo({
      uid: 'u-1',
      email: 'user@example.com',
      displayName: 'User',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
    });

    const service = TestBed.inject(AuthSessionService);
    expect(await service.verifyOrLogoutAdmin()).toBe(
      AuthSessionStatus.UNAUTHORIZED
    );
    expect(authSpy.logout).toHaveBeenCalledTimes(1);
  });

  it('should revoke session and deny access to a suspended administrator', async () => {
    authSpy.waitForAuthReady.and.resolveTo({ uid: 'a-susp' } as User);
    profileSpy.getUserByUid.and.resolveTo({
      uid: 'a-susp',
      email: 'suspended@example.com',
      displayName: 'Suspended Admin',
      role: UserRole.ADMIN,
      status: UserStatus.SUSPENDED,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
    });

    const service = TestBed.inject(AuthSessionService);
    expect(await service.verifyOrLogoutAdmin()).toBe(
      AuthSessionStatus.UNAUTHORIZED
    );
    expect(authSpy.logout).toHaveBeenCalledTimes(1);
  });

  it('should deny access and sign out when the authenticated user has no profile record in the directory', async () => {
    authSpy.waitForAuthReady.and.resolveTo({ uid: 'u-missing' } as User);
    profileSpy.getUserByUid.and.resolveTo(null);

    const service = TestBed.inject(AuthSessionService);
    expect(await service.verifyOrLogoutAdmin()).toBe(
      AuthSessionStatus.UNAUTHORIZED
    );
    expect(authSpy.logout).toHaveBeenCalledTimes(1);
  });

  it('should allow access to roles dynamically enabled in runtime app configuration', async () => {
    const runtimeConfig = TestBed.inject(AuthRuntimeConfigService);
    runtimeConfig.applyRuntimeAuth({
      ...createDefaultAuthEngineConfig(),
      allowedAdminRoles: [UserRole.ADMIN, UserRole.HOST],
    });

    authSpy.waitForAuthReady.and.resolveTo({ uid: 'h-1' } as User);
    profileSpy.getUserByUid.and.resolveTo({
      uid: 'h-1',
      email: 'host@example.com',
      displayName: 'Host',
      role: UserRole.HOST,
      status: UserStatus.ACTIVE,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
    });

    const service = TestBed.inject(AuthSessionService);
    expect(await service.verifyOrLogoutAdmin()).toBe(
      AuthSessionStatus.AUTHORIZED
    );
    expect(authSpy.logout).not.toHaveBeenCalled();
  });
});
