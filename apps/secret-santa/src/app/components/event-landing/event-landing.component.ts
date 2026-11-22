import { DOCUMENT, DatePipe } from '@angular/common';
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
  FirestoreTimestampPipe,
  MESSAGE_DISPLAY_DURATION,
} from '@secret-santa/shared-core';
import { User } from 'firebase/auth';
import { MetaService } from '../../core';
import { ConfirmDialogModalComponent } from '../confirm-dialog-modal/confirm-dialog-modal.component';
import { EventGuestAuthComponent } from './event-guest-auth.component';
import {
  EventGuestRegisterPayload,
  EventLandingTab,
  EventLandingUiState,
  GooglePrefillData,
} from './event-landing-ui.model';
import { EventMatchRevealComponent } from './event-match-reveal.component';
import { EventParticipantPreferencesComponent } from './event-participant-preferences.component';

@Component({
  selector: 'app-event-landing',
  imports: [
    DatePipe,
    RouterModule,
    FirestoreTimestampPipe,
    ConfirmDialogModalComponent,
    EventGuestAuthComponent,
    EventMatchRevealComponent,
    EventParticipantPreferencesComponent,
  ],
  templateUrl: './event-landing.component.html',
  styleUrl: './event-landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventLandingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly eventService = inject(EventService);
  private readonly participantService = inject(ParticipantService);
  private readonly authService = inject(AuthService);
  private readonly metaService = inject(MetaService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly destroyRef = inject(DestroyRef);

  protected eventId = '';
  private successTimerId: ReturnType<typeof setTimeout> | null = null;

  protected readonly leaveConfirmTitle = $localize`:@@leaveEventButton:Leave Event`;
  protected readonly leaveConfirmMessage = $localize`:@@leaveEventConfirm:Are you sure you want to leave this event? This action cannot be undone.`;

  protected readonly event = signal<Event | null>(null);
  protected readonly currentParticipant = signal<Participant | null>(null);
  protected readonly assignedParticipant = signal<Participant | null>(null);
  protected readonly currentUser = signal<User | null>(null);
  protected readonly googlePrefill = signal<GooglePrefillData | null>(null);
  protected readonly ui = signal<EventLandingUiState>({
    isLoading: true,
    isSubmitting: false,
    isGoogleLinked: false,
    showLeaveConfirm: false,
    errorMessage: '',
    successMessage: '',
    selectedTab: EventLandingTab.REGISTER,
  });

  protected readonly isRegistrationOpen = computed(() =>
    isEventRegistrationOpen(this.event()),
  );

  protected readonly isDrawn = computed(
    () => this.event()?.status === EventStatus.DRAWN,
  );

  protected readonly activeTab = computed<EventLandingTab>(() =>
    this.isRegistrationOpen() ? this.ui().selectedTab : EventLandingTab.LOGIN,
  );

  async ngOnInit(): Promise<void> {
    this.eventId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.eventId) {
      await this.router.navigate(['/']);
      return;
    }

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

    await this.loadEventData();
  }

  protected setActiveTab(tab: EventLandingTab): void {
    this.patchUi({ selectedTab: tab });
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

      this.metaService.updateEventMeta(loadedEvent.name);

      const participantId = this.participantService.getStoredParticipantId(
        this.eventId,
      );
      if (participantId) {
        await this.loadParticipantData(participantId);
      } else {
        const authUser = await this.authService.waitForAuthReady();
        if (authUser) {
          this.currentUser.set(authUser);
          const matched = await this.participantService.loginWithUid(
            this.eventId,
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
      this.patchUi({
        errorMessage: $localize`:@@loadEventError:Failed to load event`,
      });
    } finally {
      this.patchUi({ isLoading: false });
    }
  }

  private async loadParticipantData(participantId: string): Promise<void> {
    try {
      const participant = await this.participantService.getParticipant(
        this.eventId,
        participantId,
      );
      this.currentParticipant.set(participant);

      if (participant && this.isDrawn() && participant.assignedToId) {
        const assigned = await this.participantService.getAssignedParticipant(
          this.eventId,
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

  protected async onRegister(
    payload: EventGuestRegisterPayload,
  ): Promise<void> {
    if (!this.event()) {
      return;
    }

    if (!this.isRegistrationOpen()) {
      this.patchUi({
        errorMessage: $localize`:@@registrationClosedError:Registration is currently closed`,
      });
      return;
    }

    this.patchUi({ isSubmitting: true, errorMessage: '' });

    try {
      const wasGoogleLinked = this.ui().isGoogleLinked;
      const participant = await this.participantService.register(this.eventId, {
        uid: wasGoogleLinked ? this.currentUser()?.uid : undefined,
        name: payload.name,
        secretWord: wasGoogleLinked ? undefined : payload.secretWord,
        email: payload.email,
        preferences: {
          general: payload.general,
          sizes: payload.sizes,
        },
      });

      this.currentParticipant.set(participant);
      this.googlePrefill.set(null);
      this.patchUi({
        isGoogleLinked: false,
        successMessage: $localize`:@@registrationSuccess:Registration successful! 🎉`,
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
            : $localize`:@@registrationError:Failed to register. Please try again.`,
      });
    } finally {
      this.patchUi({ isSubmitting: false });
    }
  }

  protected async continueWithGoogleForRegister(): Promise<void> {
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
        this.eventId,
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
      this.patchUi({
        errorMessage: $localize`:@@hostLoginError:Could not sign in with Google. Please try again.`,
      });
    } finally {
      this.patchUi({ isSubmitting: false });
    }
  }

  protected unlinkGoogle(): void {
    this.patchUi({ isGoogleLinked: false });
    this.googlePrefill.set(null);
  }

  protected async loginWithGoogleParticipant(): Promise<void> {
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
        this.eventId,
        user.uid,
        user.email,
      );
      if (!participant) {
        this.patchUi({
          errorMessage: $localize`:@@googleNotRegisteredError:No registration found for this Google account in this event.`,
        });
        return;
      }
      await this.loadParticipantData(participant.id);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({
        errorMessage: $localize`:@@loginError:Failed to login. Please try again.`,
      });
    } finally {
      this.patchUi({ isSubmitting: false });
    }
  }

  protected async onLogin(credentials: ParticipantLogin): Promise<void> {
    this.patchUi({ isSubmitting: true, errorMessage: '' });

    try {
      const participant = await this.participantService.login(
        this.eventId,
        credentials,
      );

      if (!participant) {
        this.patchUi({
          errorMessage: $localize`:@@invalidCredentials:Invalid name or secret word`,
        });
        return;
      }

      await this.loadParticipantData(participant.id);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({
        errorMessage: $localize`:@@loginError:Failed to login. Please try again.`,
      });
    } finally {
      this.patchUi({ isSubmitting: false });
    }
  }

  protected async onUpdatePreferences(
    preferences: ParticipantPreferences,
  ): Promise<void> {
    const participant = this.currentParticipant();
    if (!participant) {
      return;
    }

    this.patchUi({ isSubmitting: true, errorMessage: '' });

    try {
      await this.participantService.updatePreferences(
        this.eventId,
        participant.id,
        preferences,
      );

      this.currentParticipant.set({ ...participant, preferences });
      this.showTransientSuccess(
        $localize`:@@preferencesUpdated:Preferences updated successfully!`,
      );
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.patchUi({
        errorMessage: $localize`:@@updatePreferencesError:Failed to update preferences`,
      });
    } finally {
      this.patchUi({ isSubmitting: false });
    }
  }

  protected requestLeaveEvent(): void {
    if (!this.currentParticipant()) {
      return;
    }
    this.patchUi({ showLeaveConfirm: true });
  }

  protected cancelLeaveEvent(): void {
    this.patchUi({ showLeaveConfirm: false });
  }

  protected async confirmLeaveEvent(): Promise<void> {
    const participant = this.currentParticipant();
    this.patchUi({ showLeaveConfirm: false });
    if (!participant) {
      return;
    }

    this.patchUi({ isSubmitting: true });
    try {
      await this.eventService.deleteParticipant(this.eventId, participant.id);
      this.showTransientSuccess(
        $localize`:@@leaveEventSuccess:You have left the event successfully`,
      );
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
            : $localize`:@@leaveEventError:Failed to leave event`,
      });
    } finally {
      this.patchUi({ isSubmitting: false });
    }
  }

  protected logout(): void {
    this.participantService.clearParticipantSession(this.eventId);
    this.currentParticipant.set(null);
    this.assignedParticipant.set(null);
    this.showTransientSuccess(
      $localize`:@@logoutSuccess:Logged out successfully`,
    );
  }

  protected scrollToRegister(): void {
    this.setActiveTab(EventLandingTab.REGISTER);
    this.document
      .getElementById('register-form')
      ?.scrollIntoView({ behavior: 'smooth' });
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
