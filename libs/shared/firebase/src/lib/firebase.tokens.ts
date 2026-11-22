import { InjectionToken } from '@angular/core';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { auth, firestore } from './firebase-config';

/** Injection token providing the active `FirebaseApp` instance. */
export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP', {
  providedIn: 'root',
  factory: () => auth.app,
});

/** Injection token providing the active `Firestore` database instance. */
export const FIRESTORE_DB = new InjectionToken<Firestore>('FIRESTORE_DB', {
  providedIn: 'root',
  factory: () => firestore,
});

/** Injection token providing the active `Auth` instance. */
export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH', {
  providedIn: 'root',
  factory: () => auth,
});
