import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { BackofficeStats } from '../../models/backoffice-stats.model';
import { BackofficeStatsService } from '../../services/backoffice-stats.service';
import { StatsRecentEventsTableComponent } from '../stats-recent-events-table/stats-recent-events-table.component';
import { StatsSummaryCardsComponent } from '../stats-summary-cards/stats-summary-cards.component';

@Component({
  selector: 'bo-stats-dashboard',
  standalone: true,
  imports: [StatsSummaryCardsComponent, StatsRecentEventsTableComponent],
  templateUrl: './stats-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsDashboardComponent implements OnInit {
  private readonly statsService = inject(BackofficeStatsService);

  protected readonly stats = signal<BackofficeStats | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  protected async refresh(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const data = await this.statsService.loadStats();
      this.stats.set(data);
    } catch {
      this.errorMessage.set(
        'No se pudieron cargar las estadísticas desde Firestore.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
