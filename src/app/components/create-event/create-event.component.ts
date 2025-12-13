import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-create-event',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-event.component.html',
  styleUrl: './create-event.component.scss',
})
export class CreateEventComponent {
  eventForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  showLoginModal = false;

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private authService: AuthService,
    private router: Router
  ) {
    this.eventForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      minAmount: [0, [Validators.required, Validators.min(0)]],
      maxAmount: [null],
      revealToHost: [false],
      registrationDeadline: [null],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.eventForm.invalid) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.showLoginModal = true;
      return;
    }

    this.createEvent(currentUser.uid);
  }

  async createEvent(uid: string | undefined): Promise<void> {
    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      const formValue = this.eventForm.value;
      const { eventId, adminToken } = await this.eventService.createEvent(
        formValue,
        uid
      );

      // Navigate to admin dashboard
      this.router.navigate(['/admin', eventId]);
    } catch (error: any) {
      console.error('Error creating event:', error);
      this.errorMessage =
        error.message ||
        $localize`:@@createEventError:Failed to create event. Please try again.`;
    } finally {
      this.isSubmitting = false;
    }
  }

  async loginAndContinue() {
    try {
      await this.authService.loginWithGoogle();
      this.showLoginModal = false;
      const currentUser = this.authService.getCurrentUser();
      this.createEvent(currentUser?.uid);
    } catch (error) {
      console.error('Login failed', error);
    }
  }

  continueAsGuest() {
    this.showLoginModal = false;
    this.createEvent(undefined);
  }

  cancelModal() {
    this.showLoginModal = false;
  }
}
