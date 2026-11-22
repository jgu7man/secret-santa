export enum AdminDashboardModal {
  NONE = 'NONE',
  EDIT_EVENT = 'EDIT_EVENT',
  CONFIRM_RAFFLE = 'CONFIRM_RAFFLE',
  CONFIRM_DELETE_PARTICIPANT = 'CONFIRM_DELETE_PARTICIPANT',
}

export enum AdminEventBadgeState {
  OPEN = 'OPEN',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  DRAWN = 'DRAWN',
}

export interface AdminDashboardUiState {
  readonly isLoading: boolean;
  readonly errorMessage: string;
  readonly successMessage: string;
  readonly activeModal: AdminDashboardModal;
  readonly pendingDeleteParticipantId: string | null;
}

export interface EventStatusBadgeConfig {
  readonly badgeClass: string;
  readonly label: string;
}

export const ADMIN_EVENT_STATUS_BADGES: Readonly<
  Record<AdminEventBadgeState, EventStatusBadgeConfig>
> = {
  [AdminEventBadgeState.OPEN]: {
    badgeClass: 'bg-yellow-100 text-yellow-800',
    label: $localize`:@@statusOpen:📝 Open for Registration`,
  },
  [AdminEventBadgeState.REGISTRATION_CLOSED]: {
    badgeClass: 'bg-slate-200 text-slate-800',
    label: $localize`:@@statusRegistrationClosed:🔒 Registration Closed`,
  },
  [AdminEventBadgeState.DRAWN]: {
    badgeClass: 'bg-green-100 text-green-800',
    label: $localize`:@@statusRaffleDone:🎁 Raffle Done`,
  },
};
