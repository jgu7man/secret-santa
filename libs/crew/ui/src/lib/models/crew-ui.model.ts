import {
  AccessRequestStatus,
  AdminInviteStatus,
} from '@marxa/auth-engine';
import { UserStatus } from '@secret-santa/shared-models';

/** Active tab selection inside `CrewManagerComponent`. */
export enum CrewTab {
  DIRECTORY = 'DIRECTORY',
  ONBOARDING = 'ONBOARDING',
}

/** Catch-all filter sentinel for role/status dropdowns. */
export enum CrewFilterAll {
  ALL = 'ALL',
}

/** Declarative visual badge configuration for status pills. */
export interface CrewBadgeConfig {
  readonly label: string;
  readonly classes: string;
}

/** Status pill configuration for user account standings. */
export const USER_STATUS_BADGES: Readonly<Record<UserStatus, CrewBadgeConfig>> = {
  [UserStatus.ACTIVE]: {
    label: 'Activo',
    classes: 'bg-emerald-100 text-emerald-800',
  },
  [UserStatus.SUSPENDED]: {
    label: 'Suspendido',
    classes: 'bg-red-100 text-red-800',
  },
};

/** Action button configuration for toggling user account standing. */
export const USER_STATUS_ACTION_BUTTONS: Readonly<
  Record<UserStatus, CrewBadgeConfig>
> = {
  [UserStatus.ACTIVE]: {
    label: 'Suspender',
    classes: 'border-red-200 text-red-700 hover:bg-red-50',
  },
  [UserStatus.SUSPENDED]: {
    label: 'Reactivar',
    classes: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
  },
};

/** Status pill configuration for access requests. */
export const ACCESS_REQUEST_STATUS_BADGES: Readonly<
  Record<AccessRequestStatus, CrewBadgeConfig>
> = {
  [AccessRequestStatus.PENDING]: {
    label: 'PENDING',
    classes: 'bg-amber-100 text-amber-800',
  },
  [AccessRequestStatus.APPROVED]: {
    label: 'APPROVED',
    classes: 'bg-emerald-100 text-emerald-800',
  },
  [AccessRequestStatus.REJECTED]: {
    label: 'REJECTED',
    classes: 'bg-red-100 text-red-800',
  },
};

/** Status pill configuration for admin invitations. */
export const ADMIN_INVITE_STATUS_BADGES: Readonly<
  Record<AdminInviteStatus, CrewBadgeConfig>
> = {
  [AdminInviteStatus.PENDING]: {
    label: 'PENDING',
    classes: 'bg-amber-100 text-amber-800',
  },
  [AdminInviteStatus.ACCEPTED]: {
    label: 'ACCEPTED',
    classes: 'bg-emerald-100 text-emerald-800',
  },
  [AdminInviteStatus.REVOKED]: {
    label: 'REVOKED',
    classes: 'bg-slate-200 text-slate-700',
  },
};
