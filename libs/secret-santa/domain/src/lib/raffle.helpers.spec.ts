import { Participant } from './participant.model';
import { generateRaffleAssignments } from './raffle.helpers';

describe('raffle domain rules', () => {
  function makeParticipant(id: string, name: string): Participant {
    return {
      id,
      name,
      normalizedName: name.toLowerCase(),
      preferences: { general: 'Sorpresa' },
      assignedToId: null,
      assignedToName: null,
    };
  }

  it('should refuse running a raffle with fewer than 2 participants', () => {
    expect(() => generateRaffleAssignments([])).toThrowError(
      /at least 2 participants/
    );
    expect(() =>
      generateRaffleAssignments([makeParticipant('p-1', 'Ana')])
    ).toThrowError(/at least 2 participants/);
  });

  it('should guarantee a valid swap when exactly 2 participants join the raffle', () => {
    const participants = [
      makeParticipant('p-1', 'Ana'),
      makeParticipant('p-2', 'Luis'),
    ];

    const assignments = generateRaffleAssignments(participants);

    expect(assignments).toEqual([
      { giverId: 'p-1', receiverId: 'p-2', receiverName: 'Luis' },
      { giverId: 'p-2', receiverId: 'p-1', receiverName: 'Ana' },
    ]);
  });

  it('should assign every participant a distinct receiver without anyone drawing themselves', () => {
    const participants = [
      makeParticipant('p-1', 'Ana'),
      makeParticipant('p-2', 'Luis'),
      makeParticipant('p-3', 'Sofía'),
      makeParticipant('p-4', 'Mateo'),
      makeParticipant('p-5', 'Clara'),
    ];

    const assignments = generateRaffleAssignments(participants);

    expect(assignments.length).toBe(participants.length);
    for (const pair of assignments) {
      expect(pair.giverId).not.toBe(pair.receiverId);
    }
    const uniqueReceivers = new Set(assignments.map((pair) => pair.receiverId));
    expect(uniqueReceivers.size).toBe(participants.length);
  });

  it('should fail fast if no valid derangement is produced within the maximum attempt limit', () => {
    const participants = [
      makeParticipant('p-1', 'Ana'),
      makeParticipant('p-2', 'Luis'),
    ];
    // Returning 0.99 always picks index i in Fisher-Yates, leaving the array unshuffled (self-match).
    const identityRandom = () => 0.99;

    expect(() =>
      generateRaffleAssignments(participants, 3, identityRandom)
    ).toThrowError(/maximum attempts/);
  });
});
