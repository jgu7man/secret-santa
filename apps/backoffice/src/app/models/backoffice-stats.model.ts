import { EventStatus } from '@secret-santa/domain';

/** Per-event summary metrics displayed in the backoffice stats overview. */
export interface EventSummaryStat {
  id: string;
  name: string;
  status: EventStatus;
  isRegistrationOpen: boolean;
  participantCount: number;
  hasOwner: boolean;
  createdAtMs: number;
}

/** Aggregated platform statistics computed for the backoffice dashboard. */
export interface BackofficeStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  adminUsers: number;
  totalEvents: number;
  drawnEvents: number;
  openEvents: number;
  openRegistrationEvents: number;
  guestEvents: number;
  totalParticipants: number;
  averageParticipantsPerEvent: number;
  drawCompletionRate: number;
  recentEvents: EventSummaryStat[];
}
