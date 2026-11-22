import * as z from 'zod/mini';

const nonEmptyString = z.string().check(z.minLength(1));

/** Canonical Zod Mini schema for participant gift preferences. */
export const participantPreferencesSchema = z.object({
  general: z.string(),
  sizes: z.optional(z.string()),
});

/** Gift preferences submitted by a Secret Santa participant, inferred from `participantPreferencesSchema`. */
export type ParticipantPreferences = z.infer<typeof participantPreferencesSchema>;

/** Canonical Zod Mini schema for Firestore `events/{eventId}/participants/{participantId}` documents. */
export const participantSchema = z.object({
  id: nonEmptyString,
  uid: z.optional(z.string()),
  name: z.string(),
  normalizedName: z.string(),
  secretWord: z.optional(z.string()),
  email: z.optional(z.string()),
  preferences: participantPreferencesSchema,
  assignedToId: z.nullable(z.string()),
  assignedToName: z.nullable(z.string()),
});

/** Canonical participant record stored under `events/{eventId}/participants`, inferred from `participantSchema`. */
export type Participant = z.infer<typeof participantSchema>;

/** Registration input submitted by a participant joining an event, derived from `Participant`. */
export type ParticipantRegistration = Pick<
  Participant,
  'uid' | 'name' | 'secretWord' | 'email'
> & {
  preferences?: Partial<ParticipantPreferences>;
};

/** Credentials submitted by a participant authenticating with name and secret word. */
export type ParticipantLogin = Pick<Participant, 'name'> & {
  secretWord: string;
};
