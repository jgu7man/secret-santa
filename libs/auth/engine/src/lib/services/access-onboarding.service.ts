import { Injectable, inject } from '@angular/core';
import {
  AcceptInviteProfileInput,
  AccessRequest,
  AccessRequestSource,
  AccessRequestStatus,
  AdminInvite,
  AdminInviteStatus,
  AppUser,
  CreatedInviteResult,
  MxdUser,
  UserRole,
  UserStatus,
  accessRequestSchema,
  adminInviteSchema,
  firestoreTimestampSchema,
} from '@marxa/auth-domain';
import { FIRESTORE_DB } from '@secret-santa/shared-firebase';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { AuthRuntimeConfigService } from './auth-runtime-config.service';
import { AuthService } from './auth.service';

const MS_PER_HOUR = 60 * 60 * 1000;

/** Checks whether an `AdminInvite` is still pending and has not passed `expiresAt`. */
export function isInviteActive(
  invite: AdminInvite,
  referenceMs = Date.now()
): boolean {
  return (
    invite.status === AdminInviteStatus.PENDING &&
    invite.expiresAt.toMillis() > referenceMs
  );
}

/**
 * Headless orchestration service for access requests (`accessRequests`)
 * and invite-based onboarding (`adminInvites` + `users/{uid}`).
 */
@Injectable({
  providedIn: 'root',
})
export class AccessOnboardingService {
  private readonly db = inject(FIRESTORE_DB);
  private readonly authService = inject(AuthService);
  private readonly runtimeConfig = inject(AuthRuntimeConfigService);

  private readonly requestsCollection = collection(this.db, 'accessRequests');
  private readonly invitesCollection = collection(this.db, 'adminInvites');
  private readonly usersCollection = collection(this.db, 'users');

  /** Submits an access request using the user's Google account. */
  async submitGoogleAccessRequest(
    user: MxdUser,
    reason?: string
  ): Promise<AccessRequest> {
    const email = (user.email ?? '').trim().toLowerCase();
    if (!email) {
      throw new Error('La cuenta de Google no tiene un correo válido.');
    }

    const requestRef = doc(this.requestsCollection);
    const displayName = user.displayName?.trim() || email.split('@')[0];
    const trimmedReason = reason?.trim() || '';

    const payload: AccessRequest = {
      id: requestRef.id,
      email,
      displayName,
      uid: user.uid,
      source: AccessRequestSource.GOOGLE,
      ...(trimmedReason ? { reason: trimmedReason } : {}),
      status: AccessRequestStatus.PENDING,
      createdAt: Timestamp.now(),
    };

    await setDoc(requestRef, payload);
    return payload;
  }

  /** Submits an access request using an explicit email and display name (no Google login required). */
  async submitEmailAccessRequest(
    email: string,
    displayName: string,
    reason?: string
  ): Promise<AccessRequest> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = displayName.trim();
    const trimmedReason = reason?.trim() || '';

    if (!normalizedEmail || !normalizedName) {
      throw new Error('Nombre y correo son obligatorios.');
    }

    const requestRef = doc(this.requestsCollection);
    const payload: AccessRequest = {
      id: requestRef.id,
      email: normalizedEmail,
      displayName: normalizedName,
      source: AccessRequestSource.EMAIL,
      ...(trimmedReason ? { reason: trimmedReason } : {}),
      status: AccessRequestStatus.PENDING,
      createdAt: Timestamp.now(),
    };

    await setDoc(requestRef, payload);
    return payload;
  }

  /** Lists all access requests ordered by creation date descending (admin-only). */
  async listAccessRequests(): Promise<AccessRequest[]> {
    const q = query(this.requestsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((reqDoc) =>
      accessRequestSchema.parse({ ...reqDoc.data(), id: reqDoc.id })
    );
  }

  /** Lists all admin invitations ordered by creation date descending (admin-only). */
  async listInvites(): Promise<AdminInvite[]> {
    const q = query(this.invitesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((inviteDoc) =>
      adminInviteSchema.parse({ ...inviteDoc.data(), id: inviteDoc.id })
    );
  }

  /** Fetches a single invitation by its token document ID. */
  async getInviteByToken(token: string): Promise<AdminInvite | null> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      return null;
    }
    const inviteRef = doc(this.invitesCollection, cleanToken);
    const snapshot = await getDoc(inviteRef);
    if (!snapshot.exists()) {
      return null;
    }
    return adminInviteSchema.parse({ ...snapshot.data(), id: snapshot.id });
  }

  /** Creates a direct invitation for an email address without a prior access request. */
  async createDirectInvite(
    email: string,
    targetRole: UserRole,
    requiresProfileCompletion: boolean
  ): Promise<CreatedInviteResult> {
    const invite = this.buildInvitePayload(
      email,
      targetRole,
      requiresProfileCompletion
    );
    const inviteRef = doc(this.invitesCollection, invite.id);
    await setDoc(inviteRef, invite);

    return {
      invite,
      invitePath: this.buildInvitePath(invite.id),
    };
  }

  /** Approves a pending access request and atomically creates its invitation link. */
  async approveAccessRequest(
    request: AccessRequest,
    targetRole: UserRole,
    requiresProfileCompletion: boolean
  ): Promise<CreatedInviteResult> {
    const invite = this.buildInvitePayload(
      request.email,
      targetRole,
      requiresProfileCompletion,
      request.id
    );
    const now = Timestamp.now();
    const reviewer = this.requireActorIdentifier();

    const batch = writeBatch(this.db);
    const inviteRef = doc(this.invitesCollection, invite.id);
    const requestRef = doc(this.requestsCollection, request.id);

    batch.set(inviteRef, invite);
    batch.update(requestRef, {
      status: AccessRequestStatus.APPROVED,
      reviewedAt: now,
      reviewedBy: reviewer,
      inviteId: invite.id,
    });

    await batch.commit();

    return {
      invite,
      invitePath: this.buildInvitePath(invite.id),
    };
  }

  /** Marks a pending access request as rejected (admin-only). */
  async rejectAccessRequest(requestId: string): Promise<void> {
    const requestRef = doc(this.requestsCollection, requestId);
    await updateDoc(requestRef, {
      status: AccessRequestStatus.REJECTED,
      reviewedAt: Timestamp.now(),
      reviewedBy: this.requireActorIdentifier(),
    });
  }

  /** Revokes a pending invitation so it can no longer be redeemed. */
  async revokeInvite(inviteId: string): Promise<void> {
    const inviteRef = doc(this.invitesCollection, inviteId);
    await updateDoc(inviteRef, {
      status: AdminInviteStatus.REVOKED,
    });
  }

  /**
   * Redeems a pending invitation for the currently authenticated Google user
   * via an atomic Firestore batch (`adminInvites/{token}` + `users/{uid}`).
   */
  async acceptInviteForAuthenticatedUser(
    invite: AdminInvite,
    user: MxdUser,
    profileInput?: AcceptInviteProfileInput
  ): Promise<AppUser> {
    if (!isInviteActive(invite)) {
      throw new Error('Esta invitación ya no es válida o ha expirado.');
    }

    const userEmail = (user.email ?? '').trim().toLowerCase();
    if (!userEmail || userEmail !== invite.email.trim().toLowerCase()) {
      throw new Error(
        `Debes iniciar sesión con el correo invitado (${invite.email}).`
      );
    }

    const now = Timestamp.now();
    const displayName =
      profileInput?.displayName.trim() ||
      user.displayName?.trim() ||
      userEmail.split('@')[0];

    const userRef = doc(this.usersCollection, user.uid);
    const existingSnap = await getDoc(userRef);
    const inviteRef = doc(this.invitesCollection, invite.id);

    const batch = writeBatch(this.db);
    batch.update(inviteRef, {
      status: AdminInviteStatus.ACCEPTED,
      acceptedAt: now,
      acceptedByUid: user.uid,
    });

    let resultingUser: AppUser;
    if (existingSnap.exists()) {
      batch.update(userRef, {
        email: userEmail,
        displayName,
        ...(user.photoURL ? { photoURL: user.photoURL } : {}),
        role: invite.targetRole,
        status: UserStatus.ACTIVE,
        lastLoginAt: now,
        acceptedInviteId: invite.id,
      });

      const existingData = existingSnap.data();
      resultingUser = {
        uid: user.uid,
        email: userEmail,
        displayName,
        ...(user.photoURL ? { photoURL: user.photoURL } : {}),
        role: invite.targetRole,
        status: UserStatus.ACTIVE,
        createdAt: firestoreTimestampSchema.parse(existingData['createdAt']),
        lastLoginAt: now,
        acceptedInviteId: invite.id,
      };
    } else {
      resultingUser = {
        uid: user.uid,
        email: userEmail,
        displayName,
        ...(user.photoURL ? { photoURL: user.photoURL } : {}),
        role: invite.targetRole,
        status: UserStatus.ACTIVE,
        createdAt: now,
        lastLoginAt: now,
        acceptedInviteId: invite.id,
      };
      batch.set(userRef, resultingUser);
    }

    await batch.commit();
    return resultingUser;
  }

  private buildInvitePayload(
    email: string,
    targetRole: UserRole,
    requiresProfileCompletion: boolean,
    requestId?: string
  ): AdminInvite {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Debes ingresar un correo electrónico válido.');
    }

    const nowMs = Date.now();
    const expiresMs =
      nowMs + this.runtimeConfig.config().inviteExpirationHours * MS_PER_HOUR;

    return {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      targetRole,
      status: AdminInviteStatus.PENDING,
      requiresProfileCompletion,
      createdAt: Timestamp.fromMillis(nowMs),
      expiresAt: Timestamp.fromMillis(expiresMs),
      createdBy: this.requireActorIdentifier(),
      ...(requestId ? { requestId } : {}),
    };
  }

  private buildInvitePath(inviteId: string): string {
    const base = this.runtimeConfig.config().inviteBasePath.replace(/\/+$/, '');
    return `${base}/${inviteId}`;
  }

  private requireActorIdentifier(): string {
    const current = this.authService.getCurrentUser();
    if (!current) {
      throw new Error('Se requiere una sesión de administrador activa.');
    }
    return current.email ?? current.uid;
  }
}
