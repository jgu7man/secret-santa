import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BackofficeStats } from '@secret-santa/shared-models';

/**
 * Presentational grid of platform KPI summary cards for the Backoffice dashboard.
 */
@Component({
  selector: 'bo-stats-summary-cards',
  standalone: true,
  templateUrl: './stats-summary-cards.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsSummaryCardsComponent {
  readonly stats = input.required<BackofficeStats>();
}
