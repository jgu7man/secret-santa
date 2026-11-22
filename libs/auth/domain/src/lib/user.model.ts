import { Timestamp } from 'firebase/firestore';
import * as z from 'zod/mini';

/** Authorization role assigned to a platform user in Firestore `users/{uid}`. */
export enum UserRole {
  USER = 'USER',
  HOST = 'HOST',
  ADMIN = 'ADMIN',
}

/** Account standing controlling access to platform and backoffice actions. */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

/** Runtime type guard for `UserRole`. */
export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === 'string' &&
    Object.values(UserRole).some((candidate) => candidate === value)
  );
}

/** Runtime type guard for `UserStatus`. */
export function isUserStatus(value: unknown): value is UserStatus {
  return (
    typeof value === 'string' &&
    Object.values(UserStatus).some((candidate) => candidate === value)
  );
}

const nonEmptyString = z.string().check(z.minLength(1));

/** Canonical Zod Mini schema for Firestore `users/{uid}` documents. */
export const appUserSchema = z.object({
  uid: nonEmptyString,
  email: z.string(),
  displayName: nonEmptyString,
  photoURL: z.optional(nonEmptyString),
  role: z.enum(UserRole),
  status: z.enum(UserStatus),
  createdAt: z.instanceof(Timestamp),
  lastLoginAt: z.instanceof(Timestamp),
  notes: z.optional(z.string()),
  acceptedInviteId: z.optional(nonEmptyString),
});

/** Canonical user profile document stored in Firestore `users/{uid}`, inferred from `appUserSchema`. */
export type AppUser = z.infer<typeof appUserSchema>;

/** Backoffice update payload applied by an administrator to a user profile. */
export interface UpdateUserAdminInput {
  role?: UserRole;
  status?: UserStatus;
  notes?: string;
}
