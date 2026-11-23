import { DOCUMENT } from '@angular/common';
import {
  DestroyRef,
  ErrorHandler,
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
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
  LONG_MESSAGE_DISPLAY_DURATION,
  MESSAGE_DISPLAY_DURATION,
  buildWhatsappShareUrl,
} from '@secret-santa/shared-core';
import { User } from 'firebase/auth';
import {
  ADMIN_DASHBOARD_COPYS,
  formatDeleteEventConfirm,
  formatRegistrationToggleSuccess,
  formatWhatsappInviteMessage,
} from './admin-dashboard-copys.model';
import {
  ADMIN_EVENT_PHASE_HINTS,
  ADMIN_EVENT_STATUS_BADGES,
  AdminDashboardModal,
  AdminDashboardUiState,
  AdminEventBadgeState,
} from './admin-dashboard-ui.model';

/**
 * Component-scoped state store and command facade for `AdminDashboardComponent`.
 * Keeps the smart component thin by encapsulating Firestore mutations,
 * modal state, clipboard/share helpers, and transient feedback timers.
 */
@Injectable()
export class AdminDashboardStore {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly eventService = inject(EventService);
  private readonly participantService = inject(ParticipantService);
  private readonly authService = inject(AuthService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly destroyRef = inject(DestroyRef);

  private eventId = '';
  private successTimerId: ReturnType<typeof setTimeout> | null = null;

  readonly currentUser = signal<User | null>(null);
  readonly event = signal<Event | null>(null);
  readonly participants = signal<Participant[]>([]);
  readonly ui = signal<AdminDashboardUiState>({
    isLoading: true,
    errorMessage: '',
    successMessage: '',
    activeModal: AdminDashboardModal.NONE,
    pendingDeleteParticipantId: null,
  });

  readonly isDrawn = computed(
    () => this.event()?.status === EventStatus.DRAWN,
  );
  readonly phaseState = computed<AdminEventBadgeState>(() => {
    const current = this.event();
    if (!current || current.status === EventStatus.DRAWN) {
      return AdminEventBadgeState.DRAWN;
    }
    return current.isRegistrationOpen
      ? AdminEventBadgeState.OPEN
      : AdminEventBadgeState.REGISTRATION_CLOSED;
  });
  readonly statusBadge = computed(
    () => ADMIN_EVENT_STATUS_BADGES[this.phaseState()],
  );
  readonly phaseHint = computed(
    () => ADMIN_EVENT_PHASE_HINTS[this.phaseState()],
  );
  readonly canRunRaffle = computed(() =>
    canRunEventRaffle(this.event(), this.participants().length),
  );
  readonly canRevealResults = computed(
    () => this.isDrawn() && this.event()?.revealToHost === true,
  );
  readonly canClaimEvent = computed(() => {
    const current = this.event();
    return current !== null && !current.ownerId;
  });
  readonly canDeleteEvent = computed(() => {
    const current = this.event();
    const user = this.currentUser();
    return current !== null && user !== null && current.ownerId === user.uid;
  });
  readonly deleteEventMessage = computed(() => {
    const current = this.event();
    return current ? formatDeleteEventConfirm(current.name) : '';
  });
  readonly whatsappShareUrl = computed(() => {
    const current = this.event();
    if (!current || !this.eventId) {
      return 'https://wa.me/';
    }
    const link = new URL(`event/${this.eventId}`, this.document.baseURI).href;
    return buildWhatsappShareUrl(
      formatWhatsappInviteMessage(current.name, link),
    );
  });

  constructor() {
    this.authService.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUser.set(user);
      });

    this.destroyRef.onDestroy(() => {
      if (this.successTimerId !== null) {
        clearTimeout(this.successTimerId);
      }
    });
  }

  async init(eventId: string): Promise<void> {
    this.eventId = eventId;
    if (!this.eventId) {
      await this.router.navigate(['/']);
      return;
    }
    await this.loadEventData();
  }

  async loadEventData(): Promise<void> {
    this.patchUi({ isLoading: true });
    try {
      const loadedEvent = await this.eventService.getEvent(this.eventId);
      this.event.set(loadedEvent);
      if (!loadedEvent) {
        this.patchUi({ errorMessage: ADMIN_DASHBOARD_COPYS.eventNotFound });
        return;
      }

      const loadedParticipants = await this.participantService.getParticipants(
        this.eventId,
      );
      this.participants.set(loadedParticipants);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({ errorMessage: ADMIN_DASHBOARD_COPYS.loadEventDataError });
    } finally {
      this.patchUi({ isLoading: false });
    }
  }

  openModal(modal: AdminDashboardModal): void {
    if (!this.event()) {
      return;
    }
    this.patchUi({ activeModal: modal });
  }

  closeModal(): void {
    this.patchUi({
      activeModal: AdminDashboardModal.NONE,
      pendingDeleteParticipantId: null,
    });
  }

  async confirmCloseRegistration(): Promise<void> {
    this.closeModal();
    await this.setRegistrationOpen(false);
  }

  async reopenRegistration(): Promise<void> {
    await this.setRegistrationOpen(true);
  }

  async updateEvent(updates: Partial<CreateEventData>): Promise<void> {
    if (!this.event()) {
      return;
    }

    try {
      await this.eventService.updateEvent(this.eventId, updates);
      await this.loadEventData();
      this.closeModal();
      this.showTransientSuccess(ADMIN_DASHBOARD_COPYS.eventUpdatedSuccess);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({ errorMessage: ADMIN_DASHBOARD_COPYS.eventUpdateError });
    }
  }

  navigateToEvent(): void {
    void this.router.navigate(['/event', this.eventId]);
  }

  async runRaffle(): Promise<void> {
    this.closeModal();

    if (this.participants().length < MIN_RAFFLE_PARTICIPANTS) {
      this.patchUi({
        errorMessage: ADMIN_DASHBOARD_COPYS.minParticipantsError,
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
        ADMIN_DASHBOARD_COPYS.raffleSuccess,
        LONG_MESSAGE_DISPLAY_DURATION,
      );
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({
        errorMessage:
          error instanceof Error && error.message
            ? error.message
            : ADMIN_DASHBOARD_COPYS.raffleError,
      });
    }
  }

  async copyParticipantLink(): Promise<void> {
    const link = new URL(`event/${this.eventId}`, this.document.baseURI).href;
    await this.copyTextToClipboard(link, ADMIN_DASHBOARD_COPYS.copyLinkSuccess);
  }

  async copyResetLink(participantId: string): Promise<void> {
    const link = new URL(
      `event/${this.eventId}/reset/${participantId}`,
      this.document.baseURI,
    ).href;
    await this.copyTextToClipboard(
      link,
      ADMIN_DASHBOARD_COPYS.copyResetLinkSuccess,
    );
  }

  requestDeleteParticipant(participantId: string): void {
    this.patchUi({
      activeModal: AdminDashboardModal.CONFIRM_DELETE_PARTICIPANT,
      pendingDeleteParticipantId: participantId,
    });
  }

  async confirmDeleteParticipant(): Promise<void> {
    const participantId = this.ui().pendingDeleteParticipantId;
    this.closeModal();
    if (!participantId) {
      return;
    }

    try {
      this.patchUi({ isLoading: true });
      await this.eventService.deleteParticipant(this.eventId, participantId);
      this.showTransientSuccess(ADMIN_DASHBOARD_COPYS.deleteParticipantSuccess);
      await this.loadEventData();
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({
        errorMessage:
          error instanceof Error && error.message
            ? error.message
            : ADMIN_DASHBOARD_COPYS.deleteParticipantError,
      });
    } finally {
      this.patchUi({ isLoading: false });
    }
  }

  async confirmDeleteEvent(): Promise<void> {
    this.closeModal();
    if (!this.canDeleteEvent()) {
      return;
    }

    try {
      this.patchUi({ isLoading: true, errorMessage: '' });
      await this.eventService.deleteEvent(this.eventId);
      await this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({ errorMessage: ADMIN_DASHBOARD_COPYS.deleteEventError });
    } finally {
      this.patchUi({ isLoading: false });
    }
  }

  async claimEvent(): Promise<void> {
    const currentEvent = this.event();
    if (!currentEvent) {
      return;
    }

    try {
      let user = this.currentUser();
      if (!user) {
        await this.authService.loginWithGoogle();
        user = this.authService.getCurrentUser();
      }

      if (user) {
        await this.eventService.assignOwner(this.eventId, user.uid);
        this.event.set({ ...currentEvent, ownerId: user.uid });
        this.showTransientSuccess(ADMIN_DASHBOARD_COPYS.claimEventSuccess);
      }
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({ errorMessage: ADMIN_DASHBOARD_COPYS.claimEventError });
    }
  }

  private async setRegistrationOpen(newState: boolean): Promise<void> {
    const currentEvent = this.event();
    if (!currentEvent) {
      return;
    }

    try {
      await this.eventService.toggleRegistration(this.eventId, newState);
      this.event.set({ ...currentEvent, isRegistrationOpen: newState });
      this.showTransientSuccess(formatRegistrationToggleSuccess(newState));
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({
        errorMessage: ADMIN_DASHBOARD_COPYS.toggleRegistrationError,
      });
    }
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
      this.patchUi({ errorMessage: ADMIN_DASHBOARD_COPYS.copyLinkError });
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
