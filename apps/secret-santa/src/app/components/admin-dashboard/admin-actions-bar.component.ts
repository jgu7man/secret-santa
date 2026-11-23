import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { EventStatus, MIN_RAFFLE_PARTICIPANTS } from '@secret-santa/domain';
import { AdminEventBadgeState } from './admin-dashboard-ui.model';

@Component({
  selector: 'app-admin-actions-bar',
  standalone: true,
  templateUrl: './admin-actions-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminActionsBarComponent {
  readonly phaseState = input.required<AdminEventBadgeState>();
  readonly phaseHint = input.required<string>();
  readonly eventStatus = input.required<EventStatus>();
  readonly participantCount = input.required<number>();
  readonly canRunRaffle = input.required<boolean>();
  readonly whatsappShareUrl = input.required<string>();

  readonly copyLink = output<void>();
  readonly requestCloseRegistration = output<void>();
  readonly reopenRegistration = output<void>();
  readonly requestRaffle = output<void>();
  readonly participate = output<void>();

  protected readonly AdminEventBadgeState = AdminEventBadgeState;
  protected readonly EventStatus = EventStatus;
  protected readonly minRaffleParticipants = MIN_RAFFLE_PARTICIPANTS;
}
