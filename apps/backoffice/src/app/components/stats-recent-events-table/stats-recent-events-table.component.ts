import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BackofficeStats } from '@secret-santa/shared-models';
import { EVENT_STATUS_BADGES } from '../../models/backoffice-ui.model';

/**
 * Presentational table card displaying the most recent Secret Santa events.
 */
@Component({
  selector: 'bo-stats-recent-events-table',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './stats-recent-events-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsRecentEventsTableComponent {
  readonly recentEvents = input.required<BackofficeStats['recentEvents']>();
  readonly openRegistrationEvents = input.required<number>();

  protected readonly statusBadges = EVENT_STATUS_BADGES;
}
