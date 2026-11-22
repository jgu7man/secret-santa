import { Event, EventStatus } from './event.model';

/** Minimum number of participants required to execute a Secret Santa draw. */
export const MIN_RAFFLE_PARTICIPANTS = 2;

/**
 * Determines whether participants are currently allowed to register for an event,
 * respecting both the manual open flag and the optional registration deadline.
 */
export function isEventRegistrationOpen(
  event: Pick<Event, 'isRegistrationOpen' | 'registrationDeadline'> | null,
  now: Date = new Date()
): boolean {
  if (!event?.isRegistrationOpen) {
    return false;
  }

  if (event.registrationDeadline && now > event.registrationDeadline.toDate()) {
    return false;
  }

  return true;
}

/**
 * Determines whether an event meets the lifecycle and participant count requirements
 * to run or re-run the Secret Santa raffle.
 */
export function canRunEventRaffle(
  event: Pick<Event, 'status'> | null,
  participantCount: number
): boolean {
  if (!event) {
    return false;
  }

  return (
    (event.status === EventStatus.CREATED ||
      event.status === EventStatus.DRAWN) &&
    participantCount >= MIN_RAFFLE_PARTICIPANTS
  );
}

/**
 * Formats a local `Date` instance as `YYYY-MM-DDTHH:mm` for `<input type="datetime-local">`.
 */
export function formatDateForDateTimeLocal(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
