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
  Event,
  EventStatus,
  Participant,
  ParticipantLogin,
  ParticipantPreferences,
  isEventRegistrationOpen,
} from '@secret-santa/domain';
import {
  AnalyticsAuthMethod,
  AnalyticsEventName,
  AnalyticsService,
  MESSAGE_DISPLAY_DURATION,
} from '@secret-santa/shared-core';
import { User } from 'firebase/auth';
import { MetaService } from '../../core';
import { EVENT_LANDING_COPYS } from './event-landing-copys.model';
import {
  EventGuestRegisterPayload,
  EventLandingTab,
  EventLandingUiState,
  GooglePrefillData,
} from './event-landing-ui.model';

/**
 * Component-scoped state store and command facade for `EventLandingComponent`.
 */
@Injectable()
export class EventLandingStore {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly eventService = inject(EventService);
  private readonly participantService = inject(ParticipantService);
  private readonly authService = inject(AuthService);
  private readonly metaService = inject(MetaService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly destroyRef = inject(DestroyRef);

  private successTimerId: ReturnType<typeof setTimeout> | null = null;

  readonly eventId = signal('');
  readonly event = signal<Event | null>(null);
  readonly currentParticipant = signal<Participant | null>(null);
  readonly assignedParticipant = signal<Participant | null>(null);
  readonly currentUser = signal<User | null>(null);
  readonly googlePrefill = signal<GooglePrefillData | null>(null);
  readonly ui = signal<EventLandingUiState>({
    isLoading: true,
    isSubmitting: false,
    isGoogleLinked: false,
    showLeaveConfirm: false,
    errorMessage: '',
    successMessage: '',
    selectedTab: EventLandingTab.REGISTER,
  });

  readonly isRegistrationOpen = computed(() =>
    isEventRegistrationOpen(this.event()),
  );

  readonly isDrawn = computed(
    () => this.event()?.status === EventStatus.DRAWN,
  );

  readonly activeTab = computed<EventLandingTab>(() =>
    this.isRegistrationOpen() ? this.ui().selectedTab : EventLandingTab.LOGIN,
  );

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
    this.eventId.set(eventId);
    if (!eventId) {
      await this.router.navigate(['/']);
      return;
    }
    await this.loadEventData();
  }

  setActiveTab(tab: EventLandingTab): void {
    this.patchUi({ selectedTab: tab });
  }

  async loadEventData(): Promise<void> {
    const id = this.eventId();
    this.patchUi({ isLoading: true });
    try {
      const loadedEvent = await this.eventService.getEvent(id);
      this.event.set(loadedEvent);
      if (!loadedEvent) {
        this.patchUi({ errorMessage: EVENT_LANDING_COPYS.eventNotFound });
        return;
      }

      this.metaService.updateEventMeta(loadedEvent.name);

      const participantId = this.participantService.getStoredParticipantId(id);
      if (participantId) {
        await this.loadParticipantData(participantId);
      } else {
        const authUser = await this.authService.waitForAuthReady();
        if (authUser) {
          this.currentUser.set(authUser);
          const matched = await this.participantService.loginWithUid(
            id,
            authUser.uid,
            authUser.email,
          );
          if (matched) {
            await this.loadParticipantData(matched.id);
          }
        }
      }
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({ errorMessage: EVENT_LANDING_COPYS.loadEventError });
    } finally {
      this.patchUi({ isLoading: false });
    }
  }

  async onRegister(payload: EventGuestRegisterPayload): Promise<void> {
    if (!this.event()) {
      return;
    }

    if (!this.isRegistrationOpen()) {
      this.patchUi({
        errorMessage: EVENT_LANDING_COPYS.registrationClosedError,
      });
      return;
    }

    this.patchUi({ isSubmitting: true, errorMessage: '' });

    try {
      const wasGoogleLinked = this.ui().isGoogleLinked;
      const participant = await this.participantService.register(
        this.eventId(),
        {
          uid: wasGoogleLinked ? this.currentUser()?.uid : undefined,
          name: payload.name,
          secretWord: wasGoogleLinked ? undefined : payload.secretWord,
          email: payload.email,
          preferences: {
            general: payload.general,
            sizes: payload.sizes,
          },
        },
      );

      this.currentParticipant.set(participant);
      this.googlePrefill.set(null);
      this.patchUi({
        isGoogleLinked: false,
        successMessage: EVENT_LANDING_COPYS.registrationSuccess,
      });
      void this.analyticsService.trackEvent(
        AnalyticsEventName.PARTICIPANT_REGISTERED,
        {
          method: wasGoogleLinked
            ? AnalyticsAuthMethod.GOOGLE
            : AnalyticsAuthMethod.SECRET_WORD,
        },
      );
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({
        errorMessage:
          error instanceof Error && error.message
            ? error.message
            : EVENT_LANDING_COPYS.registrationError,
      });
    } finally {
      this.patchUi({ isSubmitting: false });
    }
  }

  async continueWithGoogleForRegister(): Promise<void> {
    this.patchUi({ isSubmitting: true, errorMessage: '' });
    try {
      let user = this.currentUser();
      if (!user) {
        await this.authService.loginWithGoogle();
        user = this.authService.getCurrentUser();
        this.currentUser.set(user);
      }
      if (!user) {
        return;
      }

      const existing = await this.participantService.loginWithUid(
        this.eventId(),
        user.uid,
        user.email,
      );
      if (existing) {
        await this.loadParticipantData(existing.id);
        return;
      }

      this.patchUi({ isGoogleLinked: true });
      this.googlePrefill.set({
        name: user.displayName ?? undefined,
        email: user.email ?? undefined,
      });
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({ errorMessage: EVENT_LANDING_COPYS.hostLoginError });
    } finally {
      this.patchUi({ isSubmitting: false });
    }
  }

  unlinkGoogle(): void {
    this.patchUi({ isGoogleLinked: false });
    this.googlePrefill.set(null);
  }

  async loginWithGoogleParticipant(): Promise<void> {
    this.patchUi({ isSubmitting: true, errorMessage: '' });
    try {
      let user = this.currentUser();
      if (!user) {
        await this.authService.loginWithGoogle();
        user = this.authService.getCurrentUser();
        this.currentUser.set(user);
      }
      if (!user) {
        return;
      }

      const participant = await this.participantService.loginWithUid(
        this.eventId(),
        user.uid,
        user.email,
      );
      if (!participant) {
        this.patchUi({
          errorMessage: EVENT_LANDING_COPYS.googleNotRegisteredError,
        });
        return;
      }
      await this.loadParticipantData(participant.id);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({ errorMessage: EVENT_LANDING_COPYS.loginError });
    } finally {
      this.patchUi({ isSubmitting: false });
    }
  }

  async onLogin(credentials: ParticipantLogin): Promise<void> {
    this.patchUi({ isSubmitting: true, errorMessage: '' });

    try {
      const participant = await this.participantService.login(
        this.eventId(),
        credentials,
      );

      if (!participant) {
        this.patchUi({ errorMessage: EVENT_LANDING_COPYS.invalidCredentials });
        return;
      }

      await this.loadParticipantData(participant.id);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({ errorMessage: EVENT_LANDING_COPYS.loginError });
    } finally {
      this.patchUi({ isSubmitting: false });
    }
  }

  async onUpdatePreferences(
    preferences: ParticipantPreferences,
  ): Promise<void> {
    const participant = this.currentParticipant();
    if (!participant) {
      return;
    }

    this.patchUi({ isSubmitting: true, errorMessage: '' });

    try {
      await this.participantService.updatePreferences(
        this.eventId(),
        participant.id,
        preferences,
      );

      this.currentParticipant.set({ ...participant, preferences });
      this.showTransientSuccess(EVENT_LANDING_COPYS.preferencesUpdated);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({
        errorMessage: EVENT_LANDING_COPYS.updatePreferencesError,
      });
    } finally {
      this.patchUi({ isSubmitting: false });
    }
  }

  requestLeaveEvent(): void {
    if (!this.currentParticipant()) {
      return;
    }
    this.patchUi({ showLeaveConfirm: true });
  }

  cancelLeaveEvent(): void {
    this.patchUi({ showLeaveConfirm: false });
  }

  async confirmLeaveEvent(): Promise<void> {
    const participant = this.currentParticipant();
    this.patchUi({ showLeaveConfirm: false });
    if (!participant) {
      return;
    }

    this.patchUi({ isSubmitting: true });
    try {
      await this.eventService.deleteParticipant(this.eventId(), participant.id);
      this.showTransientSuccess(EVENT_LANDING_COPYS.leaveEventSuccess);
      this.currentParticipant.set(null);
      this.assignedParticipant.set(null);
      this.setActiveTab(EventLandingTab.REGISTER);
      await this.loadEventData();
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({
        errorMessage:
          error instanceof Error && error.message
            ? error.message
            : EVENT_LANDING_COPYS.leaveEventError,
      });
    } finally {
      this.patchUi({ isSubmitting: false });
    }
  }

  logout(): void {
    this.participantService.clearParticipantSession(this.eventId());
    this.currentParticipant.set(null);
    this.assignedParticipant.set(null);
    this.showTransientSuccess(EVENT_LANDING_COPYS.logoutSuccess);
  }

  scrollToRegister(): void {
    this.setActiveTab(EventLandingTab.REGISTER);
    this.document
      .getElementById('register-form')
      ?.scrollIntoView({ behavior: 'smooth' });
  }

  private async loadParticipantData(participantId: string): Promise<void> {
    try {
      const id = this.eventId();
      const participant = await this.participantService.getParticipant(
        id,
        participantId,
      );
      this.currentParticipant.set(participant);

      if (participant && this.isDrawn() && participant.assignedToId) {
        const assigned = await this.participantService.getAssignedParticipant(
          id,
          participantId,
        );
        this.assignedParticipant.set(assigned);
        if (assigned) {
          void this.analyticsService.trackEvent(
            AnalyticsEventName.MATCH_REVEALED,
          );
        }
      } else {
        this.assignedParticipant.set(null);
      }
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
    }
  }

  private patchUi(partial: Partial<EventLandingUiState>): void {
    this.ui.update((state) => ({ ...state, ...partial }));
  }

  private showTransientSuccess(message: string): void {
    if (this.successTimerId !== null) {
      clearTimeout(this.successTimerId);
    }
    this.patchUi({ successMessage: message });
    this.successTimerId = setTimeout(() => {
      this.successTimerId = null;
      this.patchUi({ successMessage: '' });
    }, MESSAGE_DISPLAY_DURATION);
  }
}
