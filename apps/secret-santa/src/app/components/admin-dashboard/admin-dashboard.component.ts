import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FirestoreTimestampPipe } from '@secret-santa/shared-core';
import { ConfirmDialogModalComponent } from '../confirm-dialog-modal/confirm-dialog-modal.component';
import { AdminActionsBarComponent } from './admin-actions-bar.component';
import { ADMIN_DASHBOARD_COPYS } from './admin-dashboard-copys.model';
import { AdminDashboardModal } from './admin-dashboard-ui.model';
import { AdminDashboardStore } from './admin-dashboard.store';
import { AdminEditEventModalComponent } from './admin-edit-event-modal.component';
import { AdminEventMenuComponent } from './admin-event-menu.component';
import { AdminParticipantsTableComponent } from './admin-participants-table.component';
import { AdminRaffleConfirmModalComponent } from './admin-raffle-confirm-modal.component';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    RouterModule,
    FirestoreTimestampPipe,
    ConfirmDialogModalComponent,
    AdminActionsBarComponent,
    AdminEditEventModalComponent,
    AdminEventMenuComponent,
    AdminParticipantsTableComponent,
    AdminRaffleConfirmModalComponent,
  ],
  providers: [AdminDashboardStore],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  protected readonly store = inject(AdminDashboardStore);
  protected readonly AdminDashboardModal = AdminDashboardModal;
  protected readonly copys = ADMIN_DASHBOARD_COPYS;

  async ngOnInit(): Promise<void> {
    const eventId = this.route.snapshot.paramMap.get('id') ?? '';
    await this.store.init(eventId);
  }
}
