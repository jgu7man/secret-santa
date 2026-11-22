import {
  ChangeDetectionStrategy,
  Component,
  ErrorHandler,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService, ParticipantService } from '@secret-santa/data-access';

function secretWordMatchValidator(
  group: AbstractControl,
): ValidationErrors | null {
  const newWord = group.get('newSecretWord')?.value;
  const confirmWord = group.get('confirmSecretWord')?.value;
  return newWord === confirmWord ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-password-reset',
  imports: [ReactiveFormsModule],
  templateUrl: './password-reset.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordResetComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly participantService = inject(ParticipantService);
  private readonly eventService = inject(EventService);
  private readonly errorHandler = inject(ErrorHandler);

  private eventId = '';
  private participantId = '';

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly isSuccess = signal(false);
  protected readonly eventName = signal('');

  protected readonly resetForm = this.fb.group(
    {
      newSecretWord: ['', [Validators.required, Validators.minLength(4)]],
      confirmSecretWord: ['', [Validators.required]],
    },
    { validators: secretWordMatchValidator },
  );

  async ngOnInit(): Promise<void> {
    this.eventId = this.route.snapshot.paramMap.get('id') ?? '';
    this.participantId =
      this.route.snapshot.paramMap.get('participantId') ?? '';

    if (!this.eventId || !this.participantId) {
      await this.router.navigate(['/']);
      return;
    }

    try {
      const event = await this.eventService.getEvent(this.eventId);
      if (event) {
        this.eventName.set(event.name);
      }
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
    }
  }

  protected async onSubmit(): Promise<void> {
    if (this.resetForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const { newSecretWord } = this.resetForm.getRawValue();
      await this.participantService.resetSecretWord(
        this.eventId,
        this.participantId,
        newSecretWord,
      );

      this.isSuccess.set(true);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.errorMessage.set(
        $localize`:@@resetSecretWordError:Failed to reset secret word. Please try again or contact the organizer.`,
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected navigateToEvent(): void {
    void this.router.navigate(['/event', this.eventId]);
  }
}
