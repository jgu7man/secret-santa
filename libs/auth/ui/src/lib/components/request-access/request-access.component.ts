import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import {
  AccessOnboardingService,
  AccessRequest,
  AuthRuntimeConfigService,
  AuthSessionService,
  EmailAccessRequestPayload,
} from '@marxa/auth-engine';
import { RequestAccessFormComponent } from '../request-access-form/request-access-form.component';

/**
 * Unindexed (`noindex`) white-label access request view orchestrating
 * Google Sign-In or email + name submission via `RequestAccessFormComponent`.
 */
@Component({
  selector: 'marxa-request-access',
  standalone: true,
  imports: [CommonModule, RouterLink, RequestAccessFormComponent],
  templateUrl: './request-access.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestAccessComponent implements OnInit {
  private readonly authSession = inject(AuthSessionService);
  private readonly onboardingService = inject(AccessOnboardingService);
  private readonly meta = inject(Meta);
  protected readonly config = inject(AuthRuntimeConfigService).config;

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly submittedRequest = signal<AccessRequest | null>(null);

  ngOnInit(): void {
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  clearError(): void {
    this.errorMessage.set('');
  }

  async requestWithGoogle(reason: string): Promise<void> {
    this.isSubmitting.set(true);
    this.errorMessage.set('');
    try {
      const user = await this.authSession.loginWithGoogle();
      if (!user) {
        this.errorMessage.set('No se pudo obtener la sesión de Google.');
        return;
      }

      const created = await this.onboardingService.submitGoogleAccessRequest(
        user,
        reason
      );
      this.submittedRequest.set(created);
    } catch {
      this.errorMessage.set(
        'No se pudo enviar la solicitud con Google. Inténtalo de nuevo.'
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async submitEmailRequest(payload: EmailAccessRequestPayload): Promise<void> {
    this.isSubmitting.set(true);
    this.errorMessage.set('');
    try {
      const created = await this.onboardingService.submitEmailAccessRequest(
        payload.email,
        payload.displayName,
        payload.reason
      );
      this.submittedRequest.set(created);
    } catch {
      this.errorMessage.set(
        'No se pudo registrar la solicitud. Verifica los datos e inténtalo de nuevo.'
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
