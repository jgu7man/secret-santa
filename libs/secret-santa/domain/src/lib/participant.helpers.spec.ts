import {
  buildNewParticipant,
  matchesSecretWord,
  normalizeParticipantName,
} from './participant.helpers';

describe('participant domain rules', () => {
  it('should normalize participant names case-insensitively and trim surrounding spaces', () => {
    expect(normalizeParticipantName('  Ana Pérez  ')).toBe('ana pérez');
    expect(normalizeParticipantName('LUIS')).toBe('luis');
  });

  it('should build a valid unassigned participant with trimmed name and default preferences', () => {
    const participant = buildNewParticipant('p-1', {
      name: '  Sofía  ',
      secretWord: 'navidad',
      email: 'sofia@example.com',
      preferences: { general: 'Libros' },
    });

    expect(participant).toEqual({
      id: 'p-1',
      name: 'Sofía',
      normalizedName: 'sofía',
      secretWord: 'navidad',
      email: 'sofia@example.com',
      preferences: { general: 'Libros', sizes: '' },
      assignedToId: null,
      assignedToName: null,
    });
  });

  it('should reject building a participant when the document ID is empty', () => {
    expect(() =>
      buildNewParticipant('', { name: 'Sofía' })
    ).toThrowError();
  });

  it('should authenticate a participant only when a non-empty secret word matches exactly', () => {
    expect(matchesSecretWord({ secretWord: 'pino123' }, 'pino123')).toBeTrue();
    expect(matchesSecretWord({ secretWord: 'pino123' }, 'PINO123')).toBeFalse();
    expect(matchesSecretWord({ secretWord: undefined }, '')).toBeFalse();
    expect(matchesSecretWord({ secretWord: '' }, '')).toBeFalse();
  });
});
