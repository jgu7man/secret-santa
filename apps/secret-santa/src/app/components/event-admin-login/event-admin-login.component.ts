import {
  ChangeDetectionStrategy,
  Component,
  ErrorHandler,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '@marxa/auth-engine';
import { EventService } from '@secret-santa/data-access';

@Component({
  selector: 'app-event-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './event-admin-login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventAdminLoginComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly eventService = inject(EventService);
  private readonly errorHandler = inject(ErrorHandler);

  protected readonly eventId = signal('');
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly tokenForm = this.fb.group({
    token: ['', Validators.required],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.eventId.set(id);
    if (!id) {
      void this.router.navigate(['/']);
    }
  }

  protected async loginWithGoogle(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      await this.authService.loginWithGoogle();
      const user = this.authService.getCurrentUser();
      if (user) {
        const event = await this.eventService.getEvent(this.eventId());
        if (event && event.ownerId === user.uid) {
          await this.router.navigate(['/admin', this.eventId()]);
        } else {
          this.errorMessage.set(
            $localize`:@@adminNotOwnerError:You are not the owner of this event.`
          );
        }
      }
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.errorMessage.set(
        $localize`:@@adminGoogleLoginError:Login failed. Please try again.`
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async loginWithToken(): Promise<void> {
    if (this.tokenForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    const { token } = this.tokenForm.getRawValue();

    try {
      const isValid = await this.eventService.verifyAdminToken(
        this.eventId(),
        token
      );
      if (isValid) {
        this.eventService.storeAdminToken(this.eventId(), token);
        await this.router.navigate(['/admin', this.eventId()]);
      } else {
        this.errorMessage.set(
          $localize`:@@invalidAdminTokenError:Invalid admin token.`
        );
      }
    } catch (error: unknown) {
      this.errorHandler.handleError(error);
      this.errorMessage.set(
        $localize`:@@tokenVerificationError:Verification failed. Please try again.`
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
