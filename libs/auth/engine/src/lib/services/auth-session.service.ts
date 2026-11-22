import { Injectable, inject } from '@angular/core';
import {
  AuthSessionStatus,
  AuthUserSnapshot,
  MxdUser,
  UserStatus,
  mxdUserSchema,
} from '@marxa/auth-domain';
import { AuthRuntimeConfigService } from './auth-runtime-config.service';
import { AuthService } from './auth.service';
import { UserProfileService } from './user-profile.service';

/**
 * Single source of truth for verifying whether the current authenticated user
 * holds an active authorized RBAC role, exposing `MxdUser` without leaking `firebase/auth`.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly authService = inject(AuthService);
  private readonly userProfileService = inject(UserProfileService);
  private readonly runtimeConfig = inject(AuthRuntimeConfigService);

  /** Signs in with Google and returns the mapped `MxdUser`, or null if unavailable. */
  async loginWithGoogle(): Promise<MxdUser | null> {
    await this.authService.loginWithGoogle();
    return this.getCurrentMxdUser();
  }

  /** Signs out the current user session. */
  logout(): Promise<void> {
    return this.authService.logout();
  }

  /** Returns the currently cached authenticated user as `MxdUser`, or null. */
  getCurrentMxdUser(): MxdUser | null {
    const user = this.authService.getCurrentUser();
    return user ? this.toMxdUser(user) : null;
  }

  /** Waits for persisted auth state to resolve and returns `MxdUser`, or null. */
  async waitForMxdUser(): Promise<MxdUser | null> {
    const user = await this.authService.waitForAuthReady();
    return user ? this.toMxdUser(user) : null;
  }

  private toMxdUser(user: AuthUserSnapshot): MxdUser {
    return mxdUserSchema.parse({
      uid: user.uid,
      email: user.email ?? undefined,
      displayName: user.displayName ?? undefined,
      photoURL: user.photoURL ?? undefined,
    });
  }

  /**
   * Waits for persisted auth state and verifies active RBAC privileges.
   * Automatically signs out any authenticated unauthorized or suspended user.
   */
  async verifyOrLogoutAdmin(): Promise<AuthSessionStatus> {
    const user = await this.authService.waitForAuthReady();
    if (!user) {
      return AuthSessionStatus.UNAUTHENTICATED;
    }

    try {
      const profile = await this.userProfileService.getUserByUid(user.uid);
      const allowedRoles = this.runtimeConfig.config().allowedAdminRoles;
      if (
        profile &&
        allowedRoles.includes(profile.role) &&
        profile.status === UserStatus.ACTIVE
      ) {
        return AuthSessionStatus.AUTHORIZED;
      }
    } catch (error) {
      console.error('Failed to verify admin permissions:', error);
    }

    await this.authService.logout();
    return AuthSessionStatus.UNAUTHORIZED;
  }
}
