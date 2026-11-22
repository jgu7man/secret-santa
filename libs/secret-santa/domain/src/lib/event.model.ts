import { Timestamp } from 'firebase/firestore';
import * as z from 'zod/mini';

/** Lifecycle status of a Secret Santa event. */
export enum EventStatus {
  CREATED = 'CREATED',
  DRAWN = 'DRAWN',
}

/** Runtime type guard for `EventStatus`. */
export function isEventStatus(value: unknown): value is EventStatus {
  return (
    typeof value === 'string' &&
    Object.values(EventStatus).some((candidate) => candidate === value)
  );
}

const nonEmptyString = z.string().check(z.minLength(1));

/** Canonical Zod Mini schema for Firestore `events/{eventId}` documents. */
export const eventSchema = z.object({
  id: nonEmptyString,
  adminToken: z.string(),
  name: z.string(),
  minAmount: z.number(),
  maxAmount: z.optional(z.number()),
  revealToHost: z.boolean(),
  isRegistrationOpen: z.boolean(),
  status: z.enum(EventStatus),
  createdAt: z.instanceof(Timestamp),
  ownerId: z.optional(z.nullable(z.string())),
  participantUids: z.optional(z.array(z.string())),
  registrationDeadline: z.optional(z.instanceof(Timestamp)),
});

/** Canonical Firestore document shape for a Secret Santa event, inferred from `eventSchema`. */
export type Event = z.infer<typeof eventSchema>;

/** Payload required to create or update a Secret Santa event, derived from `Event`. */
export type CreateEventData = Pick<
  Event,
  'name' | 'minAmount' | 'revealToHost'
> & {
  maxAmount?: number | null;
  registrationDeadline?: string | null;
};

/** Resulting Secret Santa pairing linking a giver to their assigned receiver. */
export interface RaffleAssignment {
  readonly giverId: string;
  readonly receiverId: string;
  readonly receiverName: string;
}
