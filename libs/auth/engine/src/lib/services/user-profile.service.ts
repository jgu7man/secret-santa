import { Injectable, inject } from '@angular/core';
import {
  AppUser,
  UpdateUserAdminInput,
  UserRole,
  UserStatus,
  appUserSchema,
} from '@marxa/auth-domain';
import { FIRESTORE_DB } from '@secret-santa/shared-firebase';
import { User } from 'firebase/auth';
import {
  Timestamp,
  UpdateData,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

/**
 * Shared Firestore service managing `users/{uid}` directory profiles,
 * self-registration sync, and backoffice administrative updates.
 */
@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private readonly db = inject(FIRESTORE_DB);
  private readonly usersCollection = collection(this.db, 'users');

  /**
   * Synchronizes the authenticated Firebase user into `users/{uid}` without
   * overwriting admin-managed `role` or `status` fields.
   */
  async syncAuthenticatedUser(user: User): Promise<AppUser> {
    const userRef = doc(this.usersCollection, user.uid);
    const snapshot = await getDoc(userRef);
    const now = Timestamp.now();
    const email = user.email?.trim() || '';
    const displayName =
      user.displayName?.trim() || (email ? email.split('@')[0] : 'Usuario');

    if (!snapshot.exists()) {
      const newProfile: AppUser = {
        uid: user.uid,
        email,
        displayName,
        ...(user.photoURL ? { photoURL: user.photoURL } : {}),
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt: now,
        lastLoginAt: now,
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }

    const updates: UpdateData<AppUser> = {
      email,
      displayName,
      lastLoginAt: now,
      ...(user.photoURL ? { photoURL: user.photoURL } : {}),
    };
    await updateDoc(userRef, updates);

    const existing = appUserSchema.parse({
      ...snapshot.data(),
      uid: user.uid,
    });
    return {
      ...existing,
      email,
      displayName,
      ...(user.photoURL ? { photoURL: user.photoURL } : {}),
      lastLoginAt: now,
    };
  }

  /** Fetches a single user profile by UID, or null if no record exists. */
  async getUserByUid(uid: string): Promise<AppUser | null> {
    const userRef = doc(this.usersCollection, uid);
    const snapshot = await getDoc(userRef);
    if (!snapshot.exists()) {
      return null;
    }
    return appUserSchema.parse({ ...snapshot.data(), uid: snapshot.id });
  }

  /** Lists all user profiles ordered by most recent login (admin-only per rules). */
  async getAllUsers(): Promise<AppUser[]> {
    const q = query(this.usersCollection, orderBy('lastLoginAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((userDoc) =>
      appUserSchema.parse({ ...userDoc.data(), uid: userDoc.id })
    );
  }

  /** Updates administrative fields (`role`, `status`, `notes`) for a user profile. */
  async updateUserAdmin(
    uid: string,
    payload: UpdateUserAdminInput
  ): Promise<void> {
    const userRef = doc(this.usersCollection, uid);
    const updates: UpdateData<AppUser> = {};

    if (payload.role !== undefined) {
      updates.role = payload.role;
    }
    if (payload.status !== undefined) {
      updates.status = payload.status;
    }
    if (payload.notes !== undefined) {
      updates.notes = payload.notes.trim();
    }

    await updateDoc(userRef, updates);
  }
}
