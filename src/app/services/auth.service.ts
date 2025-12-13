import { Injectable } from '@angular/core';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { Observable } from 'rxjs';
import { auth } from '../firebase-config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<User | null>;

  constructor() {
    this.user$ = new Observable((subscriber) => {
      return onAuthStateChanged(auth, (user) => {
        subscriber.next(user);
      });
    });
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error logging in with Google', error);
      throw error;
    }
  }

  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }
}
