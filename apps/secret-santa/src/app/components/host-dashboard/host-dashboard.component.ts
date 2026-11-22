import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ErrorHandler,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@marxa/auth-engine';
import { EventService } from '@secret-santa/data-access';
import { Event, EventStatus } from '@secret-santa/domain';
import { FirestoreTimestampPipe } from '@secret-santa/shared-core';
import { User } from 'firebase/auth';
import { EventStatusPipe } from '../../pipes/event-status.pipe';
import { ConfirmDialogModalComponent } from '../confirm-dialog-modal/confirm-dialog-modal.component';

@Component({
  selector: 'app-host-dashboard',
  standalone: true,
  imports: [
    RouterModule,
    EventStatusPipe,
    FirestoreTimestampPipe,
    ConfirmDialogModalComponent,
  ],
  templateUrl: './host-dashboard.component.html',
  styleUrl: './host-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HostDashboardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);
  private readonly errorHandler = inject(ErrorHandler);

  protected readonly EventStatus = EventStatus;
  protected readonly deleteEventTitle = $localize`:@@deleteEventAction:Delete`;

  protected readonly user = signal<User | null>(null);
  protected readonly events = signal<Event[]>([]);
  protected readonly participatingEvents = signal<Event[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly pendingDeleteEvent = signal<Event | null>(null);

  protected readonly deleteEventMessage = computed(() => {
    const target = this.pendingDeleteEvent();
    return target
      ? $localize`:@@deleteEventConfirm:Are you sure you want to delete "${target.name}:EVENT_NAME:"? This action cannot be undone.`
      : '';
  });

  async ngOnInit(): Promise<void> {
    const currentUser = await this.authService.waitForAuthReady();
    if (!currentUser) {
      await this.router.navigate(['/login']);
      return;
    }

    this.user.set(currentUser);
    await this.loadEvents(currentUser.uid);

    this.authService.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (!user) {
          this.user.set(null);
          this.events.set([]);
          this.participatingEvents.set([]);
          void this.router.navigate(['/login']);
        }
      });
  }

  protected async loadEvents(userId: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const [ownedEvents, participatingEvents] = await Promise.all([
        this.eventService.getEventsByOwner(userId),
        this.eventService.getEventsByParticipant(userId),
      ]);
      this.events.set(ownedEvents);
      this.participatingEvents.set(participatingEvents);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.errorMessage.set(
        $localize`:@@loadHostEventsError:Failed to load your events. Please try again.`
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async logout(): Promise<void> {
    try {
      await this.authService.logout();
      await this.router.navigate(['/login']);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.errorMessage.set(
        $localize`:@@logoutError:Failed to sign out. Please try again.`
      );
    }
  }

  protected goToAdmin(eventId: string): void {
    void this.router.navigate(['/admin', eventId]);
  }

  protected goToEvent(eventId: string): void {
    void this.router.navigate(['/event', eventId]);
  }

  protected requestDeleteEvent(event: Event): void {
    this.pendingDeleteEvent.set(event);
  }

  protected cancelDeleteEvent(): void {
    this.pendingDeleteEvent.set(null);
  }

  protected async confirmDeleteEvent(): Promise<void> {
    const target = this.pendingDeleteEvent();
    this.pendingDeleteEvent.set(null);
    if (!target) {
      return;
    }

    this.errorMessage.set('');
    try {
      await this.eventService.deleteEvent(target.id);
      this.events.update((items) =>
        items.filter((ownedEvent) => ownedEvent.id !== target.id)
      );
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.errorMessage.set(
        $localize`:@@deleteEventError:Failed to delete event. Please try again.`
      );
    }
  }
}
