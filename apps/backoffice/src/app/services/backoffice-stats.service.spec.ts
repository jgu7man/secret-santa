import { Event, EventStatus } from '@secret-santa/domain';
import { AppUser, UserRole, UserStatus } from '@marxa/auth-domain';
import { Timestamp } from 'firebase/firestore';
import { computeBackofficeStats } from './backoffice-stats.service';

describe('computeBackofficeStats', () => {
  it('should aggregate users, events, participants, and draw completion rate', () => {
    const now = Timestamp.fromMillis(1_700_000_000_000);
    const later = Timestamp.fromMillis(1_700_100_000_000);

    const users: AppUser[] = [
      {
        uid: 'u1',
        email: 'admin@example.com',
        displayName: 'Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        createdAt: now,
        lastLoginAt: now,
      },
      {
        uid: 'u2',
        email: 'host@example.com',
        displayName: 'Host',
        role: UserRole.HOST,
        status: UserStatus.SUSPENDED,
        createdAt: now,
        lastLoginAt: now,
      },
    ];

    const events: Event[] = [
      {
        id: 'ev-1',
        adminToken: 'tok-1',
        name: 'Navidad Oficina',
        minAmount: 200,
        revealToHost: false,
        isRegistrationOpen: true,
        status: EventStatus.CREATED,
        createdAt: now,
        ownerId: 'u1',
      },
      {
        id: 'ev-2',
        adminToken: 'tok-2',
        name: 'Familia',
        minAmount: 300,
        revealToHost: true,
        isRegistrationOpen: false,
        status: EventStatus.DRAWN,
        createdAt: later,
        ownerId: null,
      },
    ];

    const counts = new Map<string, number>([
      ['ev-1', 5],
      ['ev-2', 9],
    ]);

    const result = computeBackofficeStats(users, events, counts);

    expect(result.totalUsers).toBe(2);
    expect(result.activeUsers).toBe(1);
    expect(result.suspendedUsers).toBe(1);
    expect(result.adminUsers).toBe(1);
    expect(result.totalEvents).toBe(2);
    expect(result.drawnEvents).toBe(1);
    expect(result.openEvents).toBe(1);
    expect(result.openRegistrationEvents).toBe(1);
    expect(result.guestEvents).toBe(1);
    expect(result.totalParticipants).toBe(14);
    expect(result.averageParticipantsPerEvent).toBe(7);
    expect(result.drawCompletionRate).toBe(50);
    expect(result.recentEvents[0].id).toBe('ev-2');
    expect(result.recentEvents[0].participantCount).toBe(9);
  });
});
