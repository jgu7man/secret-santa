import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ParticipantLogin } from '@secret-santa/domain';

@Component({
  selector: 'app-event-guest-login-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './event-guest-login-form.component.html',
  styleUrl: './event-guest-login-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventGuestLoginFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly isSubmitting = input.required<boolean>();
  readonly loginSubmit = output<ParticipantLogin>();
  readonly loginWithGoogle = output<void>();

  protected readonly loginForm = this.fb.group({
    name: ['', Validators.required],
    secretWord: ['', Validators.required],
  });

  protected onLoginSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }
    this.loginSubmit.emit(this.loginForm.getRawValue());
  }
}
