import { RaffleAssignment } from './event.model';
import { Participant } from './participant.model';

const DEFAULT_MAX_RAFFLE_ATTEMPTS = 1000;

/** Returns true if any giver is paired with themselves at the same index. */
export function hasSelfMatch(
  givers: ReadonlyArray<Participant>,
  receivers: ReadonlyArray<Participant>
): boolean {
  return givers.some((giver, index) => giver.id === receivers[index].id);
}

/**
 * Generates a Secret Santa derangement where every participant gives to
 * exactly one other participant and nobody draws themselves.
 */
export function generateRaffleAssignments(
  participants: ReadonlyArray<Participant>,
  maxAttempts = DEFAULT_MAX_RAFFLE_ATTEMPTS,
  randomFn: () => number = Math.random
): RaffleAssignment[] {
  if (participants.length < 2) {
    throw new Error('Need at least 2 participants to run raffle');
  }

  let receivers: Participant[];
  let attempts = 0;

  do {
    receivers = [...participants];
    shuffleInPlace(receivers, randomFn);
    attempts++;

    if (attempts > maxAttempts) {
      throw new Error(
        'Could not generate valid raffle after maximum attempts'
      );
    }
  } while (hasSelfMatch(participants, receivers));

  return participants.map((giver, index) => ({
    giverId: giver.id,
    receiverId: receivers[index].id,
    receiverName: receivers[index].name,
  }));
}

function shuffleInPlace<T>(array: T[], randomFn: () => number): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
