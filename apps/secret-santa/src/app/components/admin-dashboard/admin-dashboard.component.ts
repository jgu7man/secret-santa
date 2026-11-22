import { DOCUMENT } from '@angular/common';
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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '@marxa/auth-engine';
import { EventService, ParticipantService } from '@secret-santa/data-access';
import {
  CreateEventData,
  Event,
  EventStatus,
  MIN_RAFFLE_PARTICIPANTS,
  Participant,
  canRunEventRaffle,
} from '@secret-santa/domain';
import {
  AnalyticsEventName,
  AnalyticsService,
  FirestoreTimestampPipe,
  LONG_MESSAGE_DISPLAY_DURATION,
  MESSAGE_DISPLAY_DURATION,
} from '@secret-santa/shared-core';
import { User } from 'firebase/auth';
import { ConfirmDialogModalComponent } from '../confirm-dialog-modal/confirm-dialog-modal.component';
import {
  ADMIN_EVENT_STATUS_BADGES,
  AdminDashboardModal,
  AdminDashboardUiState,
  AdminEventBadgeState,
} from './admin-dashboard-ui.model';
import { AdminEditEventModalComponent } from './admin-edit-event-modal.component';
import { AdminParticipantsTableComponent } from './admin-participants-table.component';
import { AdminRaffleConfirmModalComponent } from './admin-raffle-confirm-modal.component';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    RouterModule,
    FirestoreTimestampPipe,
    ConfirmDialogModalComponent,
    AdminEditEventModalComponent,
    AdminParticipantsTableComponent,
    AdminRaffleConfirmModalComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly eventService = inject(EventService);
  private readonly participantService = inject(ParticipantService);
  private readonly authService = inject(AuthService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly destroyRef = inject(DestroyRef);

  private eventId = '';
  private currentUser: User | null = null;
  private successTimerId: ReturnType<typeof setTimeout> | null = null;

  protected readonly EventStatus = EventStatus;
  protected readonly AdminDashboardModal = AdminDashboardModal;
  protected readonly statusBadges = ADMIN_EVENT_STATUS_BADGES;
  protected readonly deleteParticipantTitle = $localize`:@@removeButton:🗑️ Remove`;
  protected readonly deleteParticipantMessage = $localize`:@@deleteParticipantConfirm:Are you sure you want to remove this participant? This action cannot be undone.`;

  protected readonly event = signal<Event | null>(null);
  protected readonly participants = signal<Participant[]>([]);
  protected readonly ui = signal<AdminDashboardUiState>({
    isLoading: true,
    errorMessage: '',
    successMessage: '',
    activeModal: AdminDashboardModal.NONE,
    pendingDeleteParticipantId: null,
  });

  protected readonly isDrawn = computed(
    () => this.event()?.status === EventStatus.DRAWN,
  );
  protected readonly statusBadge = computed(() => {
    const current = this.event();
    if (!current || current.status === EventStatus.DRAWN) {
      return this.statusBadges[AdminEventBadgeState.DRAWN];
    }
    return current.isRegistrationOpen
      ? this.statusBadges[AdminEventBadgeState.OPEN]
      : this.statusBadges[AdminEventBadgeState.REGISTRATION_CLOSED];
  });
  protected readonly canRunRaffle = computed(() =>
    canRunEventRaffle(this.event(), this.participants().length),
  );
  protected readonly canRevealResults = computed(
    () => this.isDrawn() && this.event()?.revealToHost === true,
  );
  protected readonly canClaimEvent = computed(() => {
    const current = this.event();
    return current !== null && !current.ownerId;
  });

  async ngOnInit(): Promise<void> {
    this.eventId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.eventId) {
      await this.router.navigate(['/']);
      return;
    }

    this.authService.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUser = user;
      });

    this.destroyRef.onDestroy(() => {
      if (this.successTimerId !== null) {
        clearTimeout(this.successTimerId);
      }
    });

    await this.loadEventData();
  }

  protected async loadEventData(): Promise<void> {
    this.patchUi({ isLoading: true });
    try {
      const loadedEvent = await this.eventService.getEvent(this.eventId);
      this.event.set(loadedEvent);
      if (!loadedEvent) {
        this.patchUi({
          errorMessage: $localize`:@@eventNotFound:Event not found`,
        });
        return;
      }

      const loadedParticipants = await this.participantService.getParticipants(
        this.eventId,
      );
      this.participants.set(loadedParticipants);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({
        errorMessage: $localize`:@@loadEventDataError:Failed to load event data`,
      });
    } finally {
      this.patchUi({ isLoading: false });
    }
  }

  protected async toggleRegistration(): Promise<void> {
    const currentEvent = this.event();
    if (!currentEvent) {
      return;
    }

    try {
      const newState = !currentEvent.isRegistrationOpen;
      await this.eventService.toggleRegistration(this.eventId, newState);
      this.event.set({ ...currentEvent, isRegistrationOpen: newState });

      const statusText = newState
        ? $localize`:@@registrationOpened:opened`
        : $localize`:@@registrationClosed:closed`;
      this.showTransientSuccess(
        $localize`:@@registrationToggleSuccess:Registration ${statusText} successfully`,
      );
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({
        errorMessage: $localize`:@@toggleRegistrationError:Failed to toggle registration`,
      });
    }
  }

  protected openModal(modal: AdminDashboardModal): void {
    if (!this.event()) {
      return;
    }
    this.patchUi({ activeModal: modal });
  }

  protected closeModal(): void {
    this.patchUi({
      activeModal: AdminDashboardModal.NONE,
      pendingDeleteParticipantId: null,
    });
  }

  protected async updateEvent(
    updates: Partial<CreateEventData>,
  ): Promise<void> {
    if (!this.event()) {
      return;
    }

    try {
      await this.eventService.updateEvent(this.eventId, updates);
      await this.loadEventData();
      this.closeModal();
      this.showTransientSuccess(
        $localize`:@@eventUpdatedSuccess:Event updated successfully!`,
      );
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({
        errorMessage: $localize`:@@eventUpdateError:Failed to update event`,
      });
    }
  }

  protected navigateToEvent(): void {
    void this.router.navigate(['/event', this.eventId]);
  }

  protected async runRaffle(): Promise<void> {
    this.closeModal();

    if (this.participants().length < MIN_RAFFLE_PARTICIPANTS) {
      this.patchUi({
        errorMessage: $localize`:@@minParticipantsError:Need at least 2 participants to run the raffle`,
      });
      return;
    }

    try {
      await this.eventService.runRaffle(this.eventId);
      void this.analyticsService.trackEvent(AnalyticsEventName.RAFFLE_DRAWN, {
        participant_count: this.participants().length,
      });
      await this.loadEventData();
      this.showTransientSuccess(
        $localize`:@@raffleSuccess:Raffle completed successfully! 🎉`,
        LONG_MESSAGE_DISPLAY_DURATION,
      );
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({
        errorMessage:
          error instanceof Error && error.message
            ? error.message
            : $localize`:@@raffleError:Failed to run raffle`,
      });
    }
  }

  protected async copyParticipantLink(): Promise<void> {
    const link = new URL(`event/${this.eventId}`, this.document.baseURI).href;
    await this.copyTextToClipboard(
      link,
      $localize`:@@copyLinkSuccess:Participant link copied to clipboard!`,
    );
  }

  protected async copyResetLink(participantId: string): Promise<void> {
    const link = new URL(
      `event/${this.eventId}/reset/${participantId}`,
      this.document.baseURI,
    ).href;
    await this.copyTextToClipboard(
      link,
      $localize`:@@copyResetLinkSuccess:Reset link copied to clipboard!`,
    );
  }

  private async copyTextToClipboard(
    text: string,
    successMessage: string,
  ): Promise<void> {
    try {
      const clipboard = this.document.defaultView?.navigator?.clipboard;
      if (!clipboard) {
        throw new Error('Clipboard API is unavailable');
      }
      await clipboard.writeText(text);
      this.showTransientSuccess(successMessage);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({
        errorMessage: $localize`:@@copyLinkError:Could not copy link to clipboard.`,
      });
    }
  }

  protected requestDeleteParticipant(participantId: string): void {
    this.patchUi({
      activeModal: AdminDashboardModal.CONFIRM_DELETE_PARTICIPANT,
      pendingDeleteParticipantId: participantId,
    });
  }

  protected async confirmDeleteParticipant(): Promise<void> {
    const participantId = this.ui().pendingDeleteParticipantId;
    this.closeModal();
    if (!participantId) {
      return;
    }

    try {
      this.patchUi({ isLoading: true });
      await this.eventService.deleteParticipant(this.eventId, participantId);
      this.showTransientSuccess(
        $localize`:@@deleteParticipantSuccess:Participant removed successfully`,
      );
      await this.loadEventData();
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({
        errorMessage:
          error instanceof Error && error.message
            ? error.message
            : $localize`:@@deleteParticipantError:Failed to remove participant`,
      });
    } finally {
      this.patchUi({ isLoading: false });
    }
  }

  protected async claimEvent(): Promise<void> {
    const currentEvent = this.event();
    if (!currentEvent) {
      return;
    }

    try {
      let user = this.currentUser;
      if (!user) {
        await this.authService.loginWithGoogle();
        user = this.authService.getCurrentUser();
      }

      if (user) {
        await this.eventService.assignOwner(this.eventId, user.uid);
        this.event.set({ ...currentEvent, ownerId: user.uid });
        this.showTransientSuccess(
          $localize`:@@claimEventSuccess:Event successfully linked to your account!`,
        );
      }
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({
        errorMessage: $localize`:@@claimEventError:Failed to claim event`,
      });
    }
  }

  private patchUi(partial: Partial<AdminDashboardUiState>): void {
    this.ui.update((state) => ({ ...state, ...partial }));
  }

  private showTransientSuccess(
    message: string,
    durationMs: number = MESSAGE_DISPLAY_DURATION,
  ): void {
    if (this.successTimerId !== null) {
      clearTimeout(this.successTimerId);
    }
    this.patchUi({ successMessage: message });
    this.successTimerId = setTimeout(() => {
      this.successTimerId = null;
      this.patchUi({ successMessage: '' });
    }, durationMs);
  }
}
