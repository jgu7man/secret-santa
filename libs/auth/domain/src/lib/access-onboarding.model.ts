import type * as z from 'zod/mini';
import type {
  accessRequestSchema,
  adminInviteSchema,
  appAuthSettingsSchema,
  mxdUserSchema,
} from './access-onboarding.schemas';

/** Canonical document stored in Firestore `accessRequests/{requestId}`, inferred from `accessRequestSchema`. */
export type AccessRequest = z.infer<typeof accessRequestSchema>;

/** Canonical document stored in Firestore `adminInvites/{inviteId}`, inferred from `adminInviteSchema`. */
export type AdminInvite = z.infer<typeof adminInviteSchema>;

/** Dynamic auth, RBAC, and redirect settings stored inside `apps/{appId}.auth`, inferred from `appAuthSettingsSchema`. */
export type AppAuthSettings = z.infer<typeof appAuthSettingsSchema>;

/** Agnostic authenticated user representation inferred from `mxdUserSchema`. */
export type MxdUser = z.infer<typeof mxdUserSchema>;

/** Minimal Firebase Auth user snapshot mapped into `MxdUser`. */
export interface AuthUserSnapshot {
  readonly uid: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly photoURL: string | null;
}

/** Optional profile fields collected before finalizing an invite acceptance. */
export interface AcceptInviteProfileInput {
  readonly displayName: string;
}

/** Form payload emitted when a user requests access via email. */
export interface EmailAccessRequestPayload {
  readonly displayName: string;
  readonly email: string;
  readonly reason: string;
}

/** Result returned when an admin approves a request or creates an invite. */
export interface CreatedInviteResult {
  readonly invite: AdminInvite;
  readonly invitePath: string;
}
