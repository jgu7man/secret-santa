import { EventStatus } from '@secret-santa/domain';

/** Visual badge configuration for event lifecycle states in Backoffice stats. */
export interface EventStatusBadgeConfig {
  readonly label: string;
  readonly classes: string;
}

/** Declarative badge mapping for `EventStatus` pills. */
export const EVENT_STATUS_BADGES: Readonly<
  Record<EventStatus, EventStatusBadgeConfig>
> = {
  [EventStatus.DRAWN]: {
    label: 'Sorteado',
    classes: 'bg-emerald-100 text-emerald-800',
  },
  [EventStatus.CREATED]: {
    label: 'Abierto',
    classes: 'bg-amber-100 text-amber-800',
  },
};

export interface NavItem {
  readonly label: string;
  readonly route: string;
  readonly description: string;
}
