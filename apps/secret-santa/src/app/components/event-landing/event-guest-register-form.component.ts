import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { User } from 'firebase/auth';
import {
  EventGuestRegisterPayload,
  GooglePrefillData,
} from './event-landing-ui.model';

@Component({
  selector: 'app-event-guest-register-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './event-guest-register-form.component.html',
  styleUrl: './event-guest-register-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventGuestRegisterFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly isRegistrationOpen = input.required<boolean>();
  readonly isSubmitting = input.required<boolean>();
  readonly isGoogleLinked = input.required<boolean>();
  readonly currentUser = input<User | null>(null);
  readonly googlePrefill = input<GooglePrefillData | null>(null);

  readonly registerSubmit = output<EventGuestRegisterPayload>();
  readonly continueWithGoogleRegister = output<void>();
  readonly unlinkGoogle = output<void>();

  protected readonly registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    secretWord: ['', [Validators.required, Validators.minLength(4)]],
    email: ['', [Validators.email]],
    general: [''],
    sizes: [''],
  });

  constructor() {
    effect(() => {
      const secretCtrl = this.registerForm.controls.secretWord;
      if (this.isGoogleLinked()) {
        secretCtrl.clearValidators();
        secretCtrl.setValue('');
      } else {
        secretCtrl.setValidators([
          Validators.required,
          Validators.minLength(4),
        ]);
      }
      secretCtrl.updateValueAndValidity();
    });

    effect(() => {
      const prefill = this.googlePrefill();
      if (!prefill) {
        return;
      }
      if (!this.registerForm.controls.name.value && prefill.name) {
        this.registerForm.patchValue({ name: prefill.name });
      }
      if (prefill.email) {
        this.registerForm.patchValue({ email: prefill.email });
      }
    });
  }

  protected onRegisterSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }
    this.registerSubmit.emit(this.registerForm.getRawValue());
  }
}
