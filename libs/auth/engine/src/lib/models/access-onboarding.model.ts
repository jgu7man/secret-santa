import type * as z from 'zod/mini';
import type {
  accessRequestSchema,
  adminInviteSchema,
  mxdUserSchema,
} from '../schemas/access-onboarding.schemas';

/** Canonical evaluation outcome for an administrative session check. */
export enum AuthSessionStatus {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  AUTHORIZED = 'AUTHORIZED',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

/** Lifecycle status of an access request submitted via `/request-access`. */
export enum AccessRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/** Authentication/submission channel used to create an access request. */
export enum AccessRequestSource {
  GOOGLE = 'GOOGLE',
  EMAIL = 'EMAIL',
}

/** Lifecycle status of an invitation token stored in `adminInvites/{inviteId}`. */
export enum AdminInviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REVOKED = 'REVOKED',
}

/** Canonical document stored in Firestore `accessRequests/{requestId}`, inferred from `accessRequestSchema`. */
export type AccessRequest = z.infer<typeof accessRequestSchema>;

/** Canonical document stored in Firestore `adminInvites/{inviteId}`, inferred from `adminInviteSchema`. */
export type AdminInvite = z.infer<typeof adminInviteSchema>;

/** Agnostic authenticated user representation inferred from `mxdUserSchema`. */
export type MxdUser = z.infer<typeof mxdUserSchema>;

/** Optional profile fields collected before finalizing an invite acceptance. */
export interface AcceptInviteProfileInput {
  displayName: string;
}

/** Form payload emitted when a user requests access via email. */
export interface EmailAccessRequestPayload {
  readonly displayName: string;
  readonly email: string;
  readonly reason: string;
}

/** Result returned when an admin approves a request or creates an invite. */
export interface CreatedInviteResult {
  invite: AdminInvite;
  invitePath: string;
}

/** Runtime type guard for `AccessRequestStatus`. */
export function isAccessRequestStatus(
  value: unknown
): value is AccessRequestStatus {
  return (
    typeof value === 'string' &&
    Object.values(AccessRequestStatus).some((candidate) => candidate === value)
  );
}

/** Runtime type guard for `AccessRequestSource`. */
export function isAccessRequestSource(
  value: unknown
): value is AccessRequestSource {
  return (
    typeof value === 'string' &&
    Object.values(AccessRequestSource).some((candidate) => candidate === value)
  );
}

/** Runtime type guard for `AdminInviteStatus`. */
export function isAdminInviteStatus(
  value: unknown
): value is AdminInviteStatus {
  return (
    typeof value === 'string' &&
    Object.values(AdminInviteStatus).some((candidate) => candidate === value)
  );
}
