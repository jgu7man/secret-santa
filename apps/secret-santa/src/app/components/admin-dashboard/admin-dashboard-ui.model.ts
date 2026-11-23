export enum AdminDashboardModal {
  NONE = 'NONE',
  EDIT_EVENT = 'EDIT_EVENT',
  CONFIRM_CLOSE_REGISTRATION = 'CONFIRM_CLOSE_REGISTRATION',
  CONFIRM_RAFFLE = 'CONFIRM_RAFFLE',
  CONFIRM_DELETE_PARTICIPANT = 'CONFIRM_DELETE_PARTICIPANT',
  CONFIRM_DELETE_EVENT = 'CONFIRM_DELETE_EVENT',
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

export const ADMIN_EVENT_PHASE_HINTS: Readonly<
  Record<AdminEventBadgeState, string>
> = {
  [AdminEventBadgeState.OPEN]: $localize`:@@phaseHintOpen:When everyone has joined (min. 2), close registration to unlock the raffle.`,
  [AdminEventBadgeState.REGISTRATION_CLOSED]: $localize`:@@phaseHintClosed:Registration is closed. You can now run the raffle to assign who gifts whom.`,
  [AdminEventBadgeState.DRAWN]: $localize`:@@phaseHintDrawn:Raffle ready! Share the link so each participant can see their Secret Santa match.`,
};
