import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { User } from 'firebase/auth';
import {
  AnalyticsService,
  AuthService,
  MESSAGE_DISPLAY_DURATION,
  MetaService,
} from '../../core';
import { Event } from '../../models/event.model';
import { Participant } from '../../models/participant.model';
import { EventService } from '../../services/event.service';
import { ParticipantService } from '../../services/participant.service';

@Component({
  selector: 'app-event-landing',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './event-landing.component.html',
  styleUrl: './event-landing.component.scss',
})
export class EventLandingComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  eventId: string = '';
  event: Event | null = null;
  currentParticipant: Participant | null = null;
  assignedParticipant: Participant | null = null;
  currentUser: User | null = null;
  isGoogleLinked = false;
  isLoading = true;
  private selectedTab: 'register' | 'login' = 'register';

  get activeTab(): 'register' | 'login' {
    return this.isRegistrationOpen ? this.selectedTab : 'login';
  }

  set activeTab(tab: 'register' | 'login') {
    this.selectedTab = tab;
  }
  isHost = false;

  registerForm: FormGroup;
  loginForm: FormGroup;
  preferencesForm: FormGroup;

  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  isEditingPreferences = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private eventService: EventService,
    private participantService: ParticipantService,
    private authService: AuthService,
    private metaService: MetaService
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      secretWord: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.email]],
      general: [''],
      sizes: [''],
    });

    this.loginForm = this.fb.group({
      name: ['', Validators.required],
      secretWord: ['', Validators.required],
    });

    this.preferencesForm = this.fb.group({
      general: [''],
      sizes: [''],
    });
  }

  async ngOnInit(): Promise<void> {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.eventId) {
      this.router.navigate(['/']);
      return;
    }

    this.checkHostStatus();
    await this.loadEventData();
  }

  checkHostStatus() {
    this.authService.user$.subscribe((user) => {
      this.currentUser = user;
      this.updateHostStatus();
    });
  }

  updateHostStatus() {
    if (!this.event) return;

    const isOwner =
      this.currentUser &&
      this.event.ownerId &&
      this.currentUser.uid === this.event.ownerId;

    const storedToken = this.eventService.getStoredAdminToken(this.eventId);
    const isTokenValid = storedToken && storedToken === this.event.adminToken;

    this.isHost = !!(isOwner || isTokenValid);
  }

  async loadEventData(): Promise<void> {
    this.isLoading = true;
    try {
      this.event = await this.eventService.getEvent(this.eventId);
      if (!this.event) {
        this.errorMessage = $localize`:@@eventNotFound:Event not found`;
        return;
      }

      // Update meta tags with event name
      this.metaService.updateEventMeta(this.event.name);

      this.updateHostStatus();

      // Check if participant is already logged in
      const participantId = this.participantService.getStoredParticipantId(
        this.eventId
      );
      if (participantId) {
        await this.loadParticipantData(participantId);
      } else {
        const authUser = await this.authService.waitForAuthReady();
        if (authUser) {
          this.currentUser = authUser;
          this.updateHostStatus();
          const matched = await this.participantService.loginWithUid(
            this.eventId,
            authUser.uid,
            authUser.email
          );
          if (matched) {
            await this.loadParticipantData(matched.id);
          }
        }
      }
    } catch (error: any) {
      console.error('Error loading event:', error);
      this.errorMessage = $localize`:@@loadEventError:Failed to load event`;
    } finally {
      this.isLoading = false;
    }
  }

  async loadParticipantData(participantId: string): Promise<void> {
    try {
      this.currentParticipant = await this.participantService.getParticipant(
        this.eventId,
        participantId
      );

      if (this.currentParticipant) {
        // Load preferences into form
        this.preferencesForm.patchValue({
          general: this.currentParticipant.preferences.general,
          sizes: this.currentParticipant.preferences.sizes,
        });

        // Load assigned participant if raffle is done
        if (
          this.event?.status === 'DRAWN' &&
          this.currentParticipant.assignedToId
        ) {
          this.assignedParticipant =
            await this.participantService.getAssignedParticipant(
              this.eventId,
              participantId
            );
          if (this.assignedParticipant) {
            void this.analyticsService.trackMatchRevealed();
          }
        }
      }
    } catch (error: any) {
      console.error('Error loading participant data:', error);
    }
  }

  async onRegister(): Promise<void> {
    if (this.registerForm.invalid || !this.event) return;

    if (!this.isRegistrationOpen) {
      this.errorMessage = $localize`:@@registrationClosedError:Registration is currently closed`;
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      const formValue = this.registerForm.value;
      const participant = await this.participantService.register(this.eventId, {
        uid: this.isGoogleLinked ? this.currentUser?.uid : undefined,
        name: formValue.name,
        secretWord: this.isGoogleLinked ? undefined : formValue.secretWord,
        email: formValue.email,
        preferences: {
          general: formValue.general,
          sizes: formValue.sizes,
        },
      });

      const wasGoogleLinked = this.isGoogleLinked;
      this.currentParticipant = participant;
      this.successMessage = $localize`:@@registrationSuccess:Registration successful! 🎉`;
      this.registerForm.reset();
      this.isGoogleLinked = false;
      void this.analyticsService.trackParticipantRegistered(wasGoogleLinked);
    } catch (error: any) {
      console.error('Error registering:', error);
      this.errorMessage =
        error.message ||
        $localize`:@@registrationError:Failed to register. Please try again.`;
    } finally {
      this.isSubmitting = false;
    }
  }

  async continueWithGoogleForRegister(): Promise<void> {
    this.isSubmitting = true;
    this.errorMessage = '';
    try {
      if (!this.currentUser) {
        await this.authService.loginWithGoogle();
        this.currentUser = this.authService.getCurrentUser();
      }
      if (!this.currentUser) return;

      const existing = await this.participantService.loginWithUid(
        this.eventId,
        this.currentUser.uid,
        this.currentUser.email
      );
      if (existing) {
        await this.loadParticipantData(existing.id);
        return;
      }

      this.isGoogleLinked = true;
      const secretCtrl = this.registerForm.get('secretWord');
      secretCtrl?.clearValidators();
      secretCtrl?.setValue('');
      secretCtrl?.updateValueAndValidity();

      if (!this.registerForm.get('name')?.value && this.currentUser.displayName) {
        this.registerForm.patchValue({ name: this.currentUser.displayName });
      }
      if (this.currentUser.email) {
        this.registerForm.patchValue({ email: this.currentUser.email });
      }
    } catch (error) {
      console.error('Google register link failed:', error);
      this.errorMessage = $localize`:@@hostLoginError:Could not sign in with Google. Please try again.`;
    } finally {
      this.isSubmitting = false;
    }
  }

  unlinkGoogle(): void {
    this.isGoogleLinked = false;
    const secretCtrl = this.registerForm.get('secretWord');
    secretCtrl?.setValidators([Validators.required, Validators.minLength(4)]);
    secretCtrl?.updateValueAndValidity();
  }

  async loginWithGoogleParticipant(): Promise<void> {
    this.isSubmitting = true;
    this.errorMessage = '';
    try {
      if (!this.currentUser) {
        await this.authService.loginWithGoogle();
        this.currentUser = this.authService.getCurrentUser();
      }
      if (!this.currentUser) return;

      const participant = await this.participantService.loginWithUid(
        this.eventId,
        this.currentUser.uid,
        this.currentUser.email
      );
      if (!participant) {
        this.errorMessage = $localize`:@@googleNotRegisteredError:No registration found for this Google account in this event.`;
        return;
      }
      await this.loadParticipantData(participant.id);
    } catch (error) {
      console.error('Google participant login failed:', error);
      this.errorMessage = $localize`:@@loginError:Failed to login. Please try again.`;
    } finally {
      this.isSubmitting = false;
    }
  }

  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      const formValue = this.loginForm.value;
      const participant = await this.participantService.login(
        this.eventId,
        formValue
      );

      if (!participant) {
        this.errorMessage = $localize`:@@invalidCredentials:Invalid name or secret word`;
        return;
      }

      await this.loadParticipantData(participant.id);
      this.loginForm.reset();
    } catch (error: any) {
      console.error('Error logging in:', error);
      this.errorMessage = $localize`:@@loginError:Failed to login. Please try again.`;
    } finally {
      this.isSubmitting = false;
    }
  }

  async onUpdatePreferences(): Promise<void> {
    if (this.preferencesForm.invalid || !this.currentParticipant) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      const formValue = this.preferencesForm.value;
      await this.participantService.updatePreferences(
        this.eventId,
        this.currentParticipant.id,
        formValue
      );

      this.currentParticipant.preferences = formValue;
      this.successMessage = $localize`:@@preferencesUpdated:Preferences updated successfully!`;
      this.isEditingPreferences = false;
      setTimeout(() => (this.successMessage = ''), MESSAGE_DISPLAY_DURATION);
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      this.errorMessage = $localize`:@@updatePreferencesError:Failed to update preferences`;
    } finally {
      this.isSubmitting = false;
    }
  }

  async leaveEvent(): Promise<void> {
    if (!this.currentParticipant) return;

    if (
      !confirm(
        $localize`:@@leaveEventConfirm:Are you sure you want to leave this event? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      this.isSubmitting = true;
      await this.eventService.deleteParticipant(
        this.eventId,
        this.currentParticipant.id
      );
      this.successMessage = $localize`:@@leaveEventSuccess:You have left the event successfully`;
      this.currentParticipant = null;
      this.assignedParticipant = null;
      this.activeTab = 'register';
      this.registerForm.reset();
      await this.loadEventData();
    } catch (error: any) {
      console.error('Error leaving event:', error);
      this.errorMessage =
        error.message || $localize`:@@leaveEventError:Failed to leave event`;
    } finally {
      this.isSubmitting = false;
      setTimeout(() => (this.successMessage = ''), MESSAGE_DISPLAY_DURATION);
    }
  }

  async loginWithGoogle() {
    try {
      await this.authService.loginWithGoogle();
    } catch (error) {
      console.error('Google login failed', error);
      this.errorMessage = $localize`:@@googleLoginError:Google login failed`;
    }
  }

  logout(): void {
    this.participantService.clearParticipantSession(this.eventId);
    this.currentParticipant = null;
    this.assignedParticipant = null;
    this.successMessage = $localize`:@@logoutSuccess:Logged out successfully`;
    setTimeout(() => (this.successMessage = ''), MESSAGE_DISPLAY_DURATION);
  }

  get isRegistrationOpen(): boolean {
    if (!this.event?.isRegistrationOpen) return false;

    if (this.event.registrationDeadline) {
      const now = new Date();
      const deadline = this.event.registrationDeadline.toDate();
      if (now > deadline) return false;
    }

    return true;
  }

  get isDrawn(): boolean {
    return this.event?.status === 'DRAWN';
  }

  scrollToRegister() {
    this.activeTab = 'register';
    document
      .getElementById('register-form')
      ?.scrollIntoView({ behavior: 'smooth' });
  }
}
