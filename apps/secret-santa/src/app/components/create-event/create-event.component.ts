import {
  ChangeDetectionStrategy,
  Component,
  ErrorHandler,
  LOCALE_ID,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@marxa/auth-engine';
import { EventService } from '@secret-santa/data-access';
import {
  AnalyticsEventName,
  AnalyticsService,
} from '@secret-santa/shared-core';
import {
  SeoLocale,
  buildBuyMeACoffeeButtonConfig,
  resolveLocaleFromId,
} from '../../core';
import { CreateEventLoginModalComponent } from './create-event-login-modal.component';

@Component({
  selector: 'app-create-event',
  imports: [ReactiveFormsModule, CreateEventLoginModalComponent],
  templateUrl: './create-event.component.html',
  styleUrl: './create-event.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateEventComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly eventService = inject(EventService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly errorHandler = inject(ErrorHandler);

  private readonly activeLocale = resolveLocaleFromId(inject(LOCALE_ID));
  protected readonly isSpanish = this.activeLocale === SeoLocale.ES_MX;
  protected readonly bmcButton = buildBuyMeACoffeeButtonConfig(
    this.activeLocale
  );

  protected readonly eventForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    minAmount: [0, [Validators.required, Validators.min(0)]],
    maxAmount: new FormControl<number | null>(null),
    revealToHost: [false],
    registrationDeadline: new FormControl<string | null>(null),
  });

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly showLoginModal = signal(false);

  protected async onSubmit(): Promise<void> {
    if (this.eventForm.invalid) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.showLoginModal.set(true);
      return;
    }

    await this.createEvent(currentUser.uid);
  }

  protected async createEvent(uid: string | undefined): Promise<void> {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const formValue = this.eventForm.getRawValue();
      const { eventId } = await this.eventService.createEvent(formValue, uid);
      void this.analyticsService.trackEvent(AnalyticsEventName.EVENT_CREATED, {
        is_guest: !uid,
      });

      await this.router.navigate(['/admin', eventId]);
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.errorMessage.set(
        error instanceof Error && error.message
          ? error.message
          : $localize`:@@createEventError:Failed to create event. Please try again.`
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected async loginAndContinue(): Promise<void> {
    try {
      await this.authService.loginWithGoogle();
      this.showLoginModal.set(false);
      const currentUser = this.authService.getCurrentUser();
      await this.createEvent(currentUser?.uid);
    } catch (error: unknown) {
      this.showLoginModal.set(false);
      this.errorHandler.handleError(error);
      this.errorMessage.set(
        $localize`:@@hostLoginError:Could not sign in with Google. Please try again.`
      );
    }
  }

  protected continueAsGuest(): void {
    this.showLoginModal.set(false);
    void this.createEvent(undefined);
  }

  protected cancelModal(): void {
    this.showLoginModal.set(false);
  }
}
