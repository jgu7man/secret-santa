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
