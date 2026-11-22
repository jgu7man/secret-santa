import {
  Participant,
  ParticipantRegistration,
  participantSchema,
} from './participant.model';

/** Normalizes a participant name for case-insensitive uniqueness and lookup queries. */
export function normalizeParticipantName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Builds and validates a canonical `Participant` document from registration input
 * before persisting to Firestore.
 */
export function buildNewParticipant(
  id: string,
  data: ParticipantRegistration,
): Participant {
  return participantSchema.parse({
    id,
    ...(data.uid ? { uid: data.uid } : {}),
    name: data.name.trim(),
    normalizedName: normalizeParticipantName(data.name),
    ...(data.secretWord ? { secretWord: data.secretWord } : {}),
    ...(data.email ? { email: data.email } : {}),
    preferences: {
      general: data.preferences?.general ?? '',
      sizes: data.preferences?.sizes ?? '',
    },
    assignedToId: null,
    assignedToName: null,
  });
}

/** Verifies whether a participant has a configured secret word matching the candidate. */
export function matchesSecretWord(
  participant: Pick<Participant, 'secretWord'>,
  candidate: string,
): boolean {
  return (
    Boolean(participant.secretWord) && participant.secretWord === candidate
  );
}
