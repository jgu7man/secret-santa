import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ParticipantService } from '../../services/participant.service';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-password-reset',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.scss'
})
export class PasswordResetComponent implements OnInit {
  eventId: string = '';
  participantId: string = '';
  resetForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  isSuccess = false;
  eventName = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private participantService: ParticipantService,
    private eventService: EventService
  ) {
    this.resetForm = this.fb.group({
      newSecretWord: ['', [Validators.required, Validators.minLength(4)]],
      confirmSecretWord: ['', [Validators.required]]
    }, { 
      validators: this.passwordMatchValidator 
    });
  }

  async ngOnInit(): Promise<void> {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    this.participantId = this.route.snapshot.paramMap.get('participantId') || '';

    if (!this.eventId || !this.participantId) {
      this.router.navigate(['/']);
      return;
    }

    // Load event name
    try {
      const event = await this.eventService.getEvent(this.eventId);
      if (event) {
        this.eventName = event.name;
      }
    } catch (error) {
      console.error('Error loading event:', error);
    }
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newSecretWord')?.value;
    const confirmPassword = group.get('confirmSecretWord')?.value;
    
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  async onSubmit(): Promise<void> {
    if (this.resetForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      const newSecretWord = this.resetForm.value.newSecretWord;
      await this.participantService.resetSecretWord(
        this.eventId,
        this.participantId,
        newSecretWord
      );

      this.isSuccess = true;
    } catch (error: any) {
      console.error('Error resetting secret word:', error);
      this.errorMessage = 'Failed to reset secret word. Please try again or contact the organizer.';
    } finally {
      this.isSubmitting = false;
    }
  }

  navigateToEvent(): void {
    this.router.navigate(['/event', this.eventId]);
  }
}
