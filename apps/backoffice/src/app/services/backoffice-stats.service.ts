import { Injectable, inject } from '@angular/core';
import {
  EventService,
  ParticipantService,
  UserProfileService,
} from '@secret-santa/shared-firebase';
import {
  AppUser,
  BackofficeStats,
  Event,
  EventStatus,
  EventSummaryStat,
  UserRole,
  UserStatus,
} from '@secret-santa/shared-models';

const MAX_RECENT_EVENTS = 10;

/** Aggregates platform metrics across users, events, and participants. */
export function computeBackofficeStats(
  users: ReadonlyArray<AppUser>,
  events: ReadonlyArray<Event>,
  participantCounts: ReadonlyMap<string, number>
): BackofficeStats {
  const activeUsers = users.filter(
    (user) => user.status === UserStatus.ACTIVE
  ).length;
  const suspendedUsers = users.filter(
    (user) => user.status === UserStatus.SUSPENDED
  ).length;
  const adminUsers = users.filter((user) => user.role === UserRole.ADMIN).length;

  const drawnEvents = events.filter(
    (event) => event.status === EventStatus.DRAWN
  ).length;
  const openEvents = events.filter(
    (event) => event.status === EventStatus.CREATED
  ).length;
  const openRegistrationEvents = events.filter(
    (event) => event.isRegistrationOpen
  ).length;
  const guestEvents = events.filter((event) => !event.ownerId).length;

  let totalParticipants = 0;
  const summaries: EventSummaryStat[] = events.map((event) => {
    const count = participantCounts.get(event.id) ?? 0;
    totalParticipants += count;
    const createdAtMs =
      typeof event.createdAt?.toMillis === 'function'
        ? event.createdAt.toMillis()
        : 0;

    return {
      id: event.id,
      name: event.name,
      status: event.status,
      isRegistrationOpen: event.isRegistrationOpen,
      participantCount: count,
      hasOwner: Boolean(event.ownerId),
      createdAtMs,
    };
  });

  const recentEvents = summaries
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .slice(0, MAX_RECENT_EVENTS);

  const totalEvents = events.length;
  const averageParticipantsPerEvent =
    totalEvents > 0
      ? Math.round((totalParticipants / totalEvents) * 10) / 10
      : 0;
  const drawCompletionRate =
    totalEvents > 0 ? Math.round((drawnEvents / totalEvents) * 100) : 0;

  return {
    totalUsers: users.length,
    activeUsers,
    suspendedUsers,
    adminUsers,
    totalEvents,
    drawnEvents,
    openEvents,
    openRegistrationEvents,
    guestEvents,
    totalParticipants,
    averageParticipantsPerEvent,
    drawCompletionRate,
    recentEvents,
  };
}

/**
 * Loads live Firestore collections and computes aggregated Backoffice statistics.
 */
@Injectable({
  providedIn: 'root',
})
export class BackofficeStatsService {
  private readonly eventService = inject(EventService);
  private readonly participantService = inject(ParticipantService);
  private readonly userProfileService = inject(UserProfileService);

  /** Fetches users, events, and per-event participant counts into a `BackofficeStats` snapshot. */
  async loadStats(): Promise<BackofficeStats> {
    const [users, events] = await Promise.all([
      this.userProfileService.getAllUsers(),
      this.eventService.getAllEvents(),
    ]);

    const participantResults = await Promise.allSettled(
      events.map(async (event) => {
        const participants = await this.participantService.getParticipants(
          event.id
        );
        return { eventId: event.id, count: participants.length };
      })
    );

    const participantCounts = new Map<string, number>();
    for (const result of participantResults) {
      if (result.status === 'fulfilled') {
        participantCounts.set(result.value.eventId, result.value.count);
      }
    }

    return computeBackofficeStats(users, events, participantCounts);
  }
}
