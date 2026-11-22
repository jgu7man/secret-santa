import { Timestamp } from 'firebase/firestore';
import {
  canRunEventRaffle,
  formatDateForDateTimeLocal,
  isEventRegistrationOpen,
} from './event.helpers';
import { EventStatus, eventSchema } from './event.model';

describe('Secret Santa event business rules', () => {
  describe('Cuando un invitado consulta si el registro de un evento está abierto', () => {
    const referenceNow = new Date('2026-12-10T12:00:00.000Z');

    it('should allow registration when the event is open and has no deadline', () => {
      expect(
        isEventRegistrationOpen({ isRegistrationOpen: true }, referenceNow)
      ).toBeTrue();
    });

    it('should block registration when the organizer manually closed registration', () => {
      expect(
        isEventRegistrationOpen({ isRegistrationOpen: false }, referenceNow)
      ).toBeFalse();
    });

    it('should block registration once the registration deadline has passed', () => {
      const expiredDeadline = Timestamp.fromDate(
        new Date('2026-12-09T23:59:59.000Z')
      );

      expect(
        isEventRegistrationOpen(
          {
            isRegistrationOpen: true,
            registrationDeadline: expiredDeadline,
          },
          referenceNow
        )
      ).toBeFalse();
    });

    it('should allow registration while the deadline is still in the future', () => {
      const futureDeadline = Timestamp.fromDate(
        new Date('2026-12-15T23:59:59.000Z')
      );

      expect(
        isEventRegistrationOpen(
          {
            isRegistrationOpen: true,
            registrationDeadline: futureDeadline,
          },
          referenceNow
        )
      ).toBeTrue();
    });
  });

  describe('Cuando el organizador evalúa si puede ejecutar o repetir el sorteo', () => {
    it('should block running the raffle with fewer than 2 participants', () => {
      expect(
        canRunEventRaffle({ status: EventStatus.CREATED }, 1)
      ).toBeFalse();
      expect(canRunEventRaffle(null, 5)).toBeFalse();
    });

    it('should allow running or re-running the raffle with at least 2 participants', () => {
      expect(canRunEventRaffle({ status: EventStatus.CREATED }, 2)).toBeTrue();
      expect(canRunEventRaffle({ status: EventStatus.DRAWN }, 4)).toBeTrue();
    });
  });

  describe('Cuando el organizador edita la fecha límite de registro en el formulario', () => {
    it('should format a Date into local YYYY-MM-DDTHH:mm format for datetime-local inputs', () => {
      const localDate = new Date(2026, 11, 24, 18, 30, 0, 0);
      expect(formatDateForDateTimeLocal(localDate)).toBe('2026-12-24T18:30');
    });
  });

  describe('Cuando Firestore devuelve documentos históricos con campos opcionales en null', () => {
    it('should accept legacy event documents with null maxAmount and registrationDeadline', () => {
      const parsed = eventSchema.parse({
        id: 'legacy-evt-1',
        adminToken: 'tok',
        name: 'Intercambio 2024',
        minAmount: 200,
        maxAmount: null,
        revealToHost: false,
        isRegistrationOpen: true,
        status: EventStatus.CREATED,
        createdAt: Timestamp.now(),
        ownerId: 'host-1',
        registrationDeadline: null,
      });

      expect(parsed.maxAmount).toBeNull();
      expect(parsed.registrationDeadline).toBeNull();
    });
  });
});
