import { Timestamp } from 'firebase/firestore';
import * as z from 'zod/mini';
import {
  AccessRequestSource,
  AccessRequestStatus,
  AdminInviteStatus,
} from './access-onboarding.enums';
import { UserRole } from './user.model';

/** Zod Mini schema validating Firestore `Timestamp` instances. */
export const firestoreTimestampSchema = z.instanceof(Timestamp);

const nonEmptyString = z.string().check(z.minLength(1));
const optionalNonEmptyString = z.optional(nonEmptyString);

/** Canonical Zod Mini schema for Firestore `accessRequests/{id}` documents. */
export const accessRequestSchema = z.object({
  id: nonEmptyString,
  email: nonEmptyString,
  displayName: nonEmptyString,
  uid: optionalNonEmptyString,
  source: z.enum(AccessRequestSource),
  reason: optionalNonEmptyString,
  status: z.enum(AccessRequestStatus),
  createdAt: firestoreTimestampSchema,
  reviewedAt: z.optional(firestoreTimestampSchema),
  reviewedBy: optionalNonEmptyString,
  inviteId: optionalNonEmptyString,
});

/** Canonical Zod Mini schema for Firestore `adminInvites/{id}` documents. */
export const adminInviteSchema = z.object({
  id: nonEmptyString,
  email: nonEmptyString,
  targetRole: z.enum(UserRole),
  status: z.enum(AdminInviteStatus),
  requiresProfileCompletion: z.boolean(),
  createdAt: firestoreTimestampSchema,
  expiresAt: firestoreTimestampSchema,
  createdBy: nonEmptyString,
  acceptedAt: z.optional(firestoreTimestampSchema),
  acceptedByUid: optionalNonEmptyString,
  requestId: optionalNonEmptyString,
});

/** Canonical Zod Mini schema for `apps/{appId}.auth` runtime configuration. */
export const appAuthSettingsSchema = z.object({
  brandName: nonEmptyString,
  appName: nonEmptyString,
  postLoginRedirectUrl: nonEmptyString,
  loginRoute: nonEmptyString,
  requestAccessRoute: nonEmptyString,
  inviteBasePath: nonEmptyString,
  requiresProfileCompletionByDefault: z.boolean(),
  defaultTargetRole: z.enum(UserRole),
  inviteExpirationHours: z.number().check(z.minimum(1), z.maximum(720)),
  allowedAdminRoles: z.array(z.enum(UserRole)).check(z.minLength(1)),
});

/** Canonical Zod Mini schema for an authenticated Marxa Digital user (`MxdUser`). */
export const mxdUserSchema = z.object({
  uid: nonEmptyString,
  email: z.optional(z.string()),
  displayName: z.optional(z.string()),
  photoURL: z.optional(z.string()),
});
