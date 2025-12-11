import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-create-event',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-event.component.html',
  styleUrl: './create-event.component.scss'
})
export class CreateEventComponent {
  eventForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private router: Router
  ) {
    this.eventForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      minAmount: [0, [Validators.required, Validators.min(0)]],
      maxAmount: [null],
      revealToHost: [false]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.eventForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      const formValue = this.eventForm.value;
      const { eventId, adminToken } = await this.eventService.createEvent(formValue);
      
      // Navigate to admin dashboard
      this.router.navigate(['/event', eventId, 'admin']);
    } catch (error: any) {
      console.error('Error creating event:', error);
      this.errorMessage = error.message || 'Failed to create event. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
