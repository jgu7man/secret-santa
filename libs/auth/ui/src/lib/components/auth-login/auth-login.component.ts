import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AuthRuntimeConfigService,
  AuthSessionService,
  AuthSessionStatus,
} from '@marxa/auth-engine';
import { AuthService } from '@secret-santa/shared-core';

/**
 * White-label administrator sign-in view.
 * Delegates session verification and unauthorized sign-out to `AuthSessionService`.
 */
@Component({
  selector: 'marxa-auth-login',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './auth-login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly config = inject(AuthRuntimeConfigService).config;

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly accessDenied = signal(false);

  ngOnInit(): void {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'unauthorized') {
      this.accessDenied.set(true);
    }
  }

  async loginWithGoogle(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.accessDenied.set(false);
    try {
      await this.authService.loginWithGoogle();
      const status = await this.authSession.verifyOrLogoutAdmin();

      if (status === AuthSessionStatus.AUTHORIZED) {
        await this.router.navigateByUrl(this.config().postLoginRedirectUrl);
        return;
      }

      if (status === AuthSessionStatus.UNAUTHORIZED) {
        this.accessDenied.set(true);
      }
    } catch {
      this.errorMessage.set(
        'No se pudo iniciar sesión con Google. Inténtalo nuevamente.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
