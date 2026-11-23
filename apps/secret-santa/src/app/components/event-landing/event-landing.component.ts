import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FirestoreTimestampPipe } from '@secret-santa/shared-core';
import { ConfirmDialogModalComponent } from '../confirm-dialog-modal/confirm-dialog-modal.component';
import { EventGuestAuthComponent } from './event-guest-auth.component';
import { EVENT_LANDING_COPYS } from './event-landing-copys.model';
import { EventLandingStore } from './event-landing.store';
import { EventMatchRevealComponent } from './event-match-reveal.component';
import { EventParticipantMenuComponent } from './event-participant-menu.component';
import { EventParticipantPreferencesComponent } from './event-participant-preferences.component';

@Component({
  selector: 'app-event-landing',
  imports: [
    RouterModule,
    FirestoreTimestampPipe,
    ConfirmDialogModalComponent,
    EventGuestAuthComponent,
    EventMatchRevealComponent,
    EventParticipantMenuComponent,
    EventParticipantPreferencesComponent,
  ],
  providers: [EventLandingStore],
  templateUrl: './event-landing.component.html',
  styleUrl: './event-landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventLandingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  protected readonly store = inject(EventLandingStore);
  protected readonly copys = EVENT_LANDING_COPYS;

  async ngOnInit(): Promise<void> {
    const eventId = this.route.snapshot.paramMap.get('id') ?? '';
    await this.store.init(eventId);
  }
}
