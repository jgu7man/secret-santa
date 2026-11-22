import { Injectable, NgZone, inject } from '@angular/core';
import {
  AnalyticsAuthMethod,
  AnalyticsEventName,
  AnalyticsService,
} from '@secret-santa/shared-core';
import { FIREBASE_AUTH } from '@secret-santa/shared-firebase';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { Observable } from 'rxjs';
import { UserProfileService } from './user-profile.service';

/**
 * Shared authentication service wrapping Firebase Auth state, Google OAuth flows,
 * and automatic `users/{uid}` directory synchronization.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly ngZone = inject(NgZone);
  private readonly firebaseAuth = inject(FIREBASE_AUTH);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly userProfileService = inject(UserProfileService);
  private readonly syncedUids = new Set<string>();
  readonly user$: Observable<User | null>;

  constructor() {
    this.user$ = new Observable((subscriber) => {
      return onAuthStateChanged(this.firebaseAuth, (user) => {
        if (user && !this.syncedUids.has(user.uid)) {
          this.syncedUids.add(user.uid);
          void this.safeSyncProfile(user);
        }
        // Firebase Auth callbacks run outside Angular's zone; re-enter so UI updates immediately.
        this.ngZone.run(() => subscriber.next(user));
      });
    });
  }

  /** Initiates Google Sign-In via popup, syncs profile, and records a login telemetry event. */
  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    try {
      const credential = await signInWithPopup(this.firebaseAuth, provider);
      this.syncedUids.add(credential.user.uid);
      await this.safeSyncProfile(credential.user);
      void this.analyticsService.trackEvent(AnalyticsEventName.LOGIN, {
        method: AnalyticsAuthMethod.GOOGLE,
      });
    } catch (error) {
      console.error('Error logging in with Google', error);
      throw error;
    }
  }

  /** Signs out the current Firebase Auth user and records a logout telemetry event. */
  async logout(): Promise<void> {
    try {
      await signOut(this.firebaseAuth);
      this.syncedUids.clear();
      void this.analyticsService.trackEvent(AnalyticsEventName.LOGOUT);
    } catch (error) {
      console.error('Error logging out', error);
      throw error;
    }
  }

  /** Returns the currently cached Firebase Auth user synchronously, if signed in. */
  getCurrentUser(): User | null {
    return this.firebaseAuth.currentUser;
  }

  /** Waits until Firebase Auth finishes resolving persisted credentials. */
  async waitForAuthReady(): Promise<User | null> {
    await this.firebaseAuth.authStateReady();
    const user = this.firebaseAuth.currentUser;
    if (user && !this.syncedUids.has(user.uid)) {
      this.syncedUids.add(user.uid);
      await this.safeSyncProfile(user);
    }
    return user;
  }

  private async safeSyncProfile(user: User): Promise<void> {
    try {
      await this.userProfileService.syncAuthenticatedUser(user);
    } catch (error) {
      console.warn('Could not sync user profile to Firestore:', error);
    }
  }
}
