import { Injectable, NgZone, inject } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { Observable } from 'rxjs';
import { auth } from '../../firebase-config';
import { AnalyticsAuthMethod } from '../config/analytics.config';
import { AnalyticsService } from './analytics.service';

/**
 * Core authentication service wrapping Firebase Auth state and Google OAuth flows.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly ngZone = inject(NgZone);
  private readonly analyticsService = inject(AnalyticsService);
  readonly user$: Observable<User | null>;

  constructor() {
    this.user$ = new Observable((subscriber) => {
      return onAuthStateChanged(auth, (user) => {
        // Firebase Auth callbacks run outside Angular's zone; re-enter so UI updates immediately.
        this.ngZone.run(() => subscriber.next(user));
      });
    });
  }

  /** Initiates Google Sign-In via popup and records a login telemetry event. */
  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      void this.analyticsService.trackLogin(AnalyticsAuthMethod.GOOGLE);
    } catch (error) {
      console.error('Error logging in with Google', error);
      throw error;
    }
  }

  /** Signs out the current Firebase Auth user and records a logout telemetry event. */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      void this.analyticsService.trackLogout();
    } catch (error) {
      console.error('Error logging out', error);
      throw error;
    }
  }

  /** Returns the currently cached Firebase Auth user synchronously, if signed in. */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /** Waits until Firebase Auth finishes resolving persisted credentials. */
  async waitForAuthReady(): Promise<User | null> {
    await auth.authStateReady();
    return auth.currentUser;
  }
}

