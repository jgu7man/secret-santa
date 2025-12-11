import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { ParticipantService } from '../../services/participant.service';
import { Event } from '../../models/event.model';
import { Participant } from '../../models/participant.model';
import { MESSAGE_DISPLAY_DURATION } from '../../constants';

@Component({
  selector: 'app-event-landing',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-landing.component.html',
  styleUrl: './event-landing.component.scss'
})
export class EventLandingComponent implements OnInit {
  eventId: string = '';
  event: Event | null = null;
  currentParticipant: Participant | null = null;
  assignedParticipant: Participant | null = null;
  isLoading = true;
  activeTab: 'register' | 'login' = 'register';
  
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
    private participantService: ParticipantService
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      secretWord: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.email]],
      general: [''],
      sizes: ['']
    });

    this.loginForm = this.fb.group({
      name: ['', Validators.required],
      secretWord: ['', Validators.required]
    });

    this.preferencesForm = this.fb.group({
      general: [''],
      sizes: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.eventId) {
      this.router.navigate(['/']);
      return;
    }

    await this.loadEventData();
  }

  async loadEventData(): Promise<void> {
    this.isLoading = true;
    try {
      this.event = await this.eventService.getEvent(this.eventId);
      if (!this.event) {
        this.errorMessage = 'Event not found';
        return;
      }

      // Check if participant is already logged in
      const participantId = this.participantService.getStoredParticipantId(this.eventId);
      if (participantId) {
        await this.loadParticipantData(participantId);
      }
    } catch (error: any) {
      console.error('Error loading event:', error);
      this.errorMessage = 'Failed to load event';
    } finally {
      this.isLoading = false;
    }
  }

  async loadParticipantData(participantId: string): Promise<void> {
    try {
      this.currentParticipant = await this.participantService.getParticipant(this.eventId, participantId);
      
      if (this.currentParticipant) {
        // Load preferences into form
        this.preferencesForm.patchValue({
          general: this.currentParticipant.preferences.general,
          sizes: this.currentParticipant.preferences.sizes
        });

        // Load assigned participant if raffle is done
        if (this.event?.status === 'DRAWN' && this.currentParticipant.assignedToId) {
          this.assignedParticipant = await this.participantService.getAssignedParticipant(
            this.eventId, 
            participantId
          );
        }
      }
    } catch (error: any) {
      console.error('Error loading participant data:', error);
    }
  }

  async onRegister(): Promise<void> {
    if (this.registerForm.invalid || !this.event) return;

    if (!this.event.isRegistrationOpen) {
      this.errorMessage = 'Registration is currently closed';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      const formValue = this.registerForm.value;
      const participant = await this.participantService.register(this.eventId, {
        name: formValue.name,
        secretWord: formValue.secretWord,
        email: formValue.email,
        preferences: {
          general: formValue.general,
          sizes: formValue.sizes
        }
      });

      this.currentParticipant = participant;
      this.successMessage = 'Registration successful! 🎉';
      this.registerForm.reset();
    } catch (error: any) {
      console.error('Error registering:', error);
      this.errorMessage = error.message || 'Failed to register. Please try again.';
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
      const participant = await this.participantService.login(this.eventId, formValue);

      if (!participant) {
        this.errorMessage = 'Invalid name or secret word';
        return;
      }

      await this.loadParticipantData(participant.id);
      this.loginForm.reset();
    } catch (error: any) {
      console.error('Error logging in:', error);
      this.errorMessage = 'Failed to login. Please try again.';
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
      this.successMessage = 'Preferences updated successfully!';
      this.isEditingPreferences = false;
      setTimeout(() => this.successMessage = '', MESSAGE_DISPLAY_DURATION);
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      this.errorMessage = 'Failed to update preferences';
    } finally {
      this.isSubmitting = false;
    }
  }

  logout(): void {
    this.participantService.clearParticipantSession(this.eventId);
    this.currentParticipant = null;
    this.assignedParticipant = null;
    this.successMessage = 'Logged out successfully';
    setTimeout(() => this.successMessage = '', MESSAGE_DISPLAY_DURATION);
  }

  get isRegistrationOpen(): boolean {
    return this.event?.isRegistrationOpen === true;
  }

  get isDrawn(): boolean {
    return this.event?.status === 'DRAWN';
  }
}
