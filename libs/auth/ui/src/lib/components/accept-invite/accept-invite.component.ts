import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AccessOnboardingService,
  AdminInvite,
  AuthRuntimeConfigService,
  AuthSessionService,
  MxdUser,
  isInviteActive,
} from '@marxa/auth-engine';

/**
 * Unindexed (`noindex`) invitation redemption view.
 * Validates the invite token, authenticates the invited user, optionally collects
 * profile details when configured, and redirects directly to the app.
 */
@Component({
  selector: 'marxa-accept-invite',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './accept-invite.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptInviteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly meta = inject(Meta);
  private readonly authSession = inject(AuthSessionService);
  private readonly onboardingService = inject(AccessOnboardingService);
  readonly config = inject(AuthRuntimeConfigService).config;

  readonly isLoading = signal(true);
  readonly isRedeeming = signal(false);
  readonly invite = signal<AdminInvite | null>(null);
  readonly authenticatedUser = signal<MxdUser | null>(null);
  readonly awaitingProfileForm = signal(false);
  readonly errorMessage = signal('');

  readonly profileForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
  });

  readonly isInviteValid = computed(() => {
    const currentInvite = this.invite();
    return currentInvite !== null && isInviteActive(currentInvite);
  });

  readonly requiresProfileStep = computed(() => {
    const currentInvite = this.invite();
    return Boolean(
      currentInvite?.requiresProfileCompletion ||
        this.config().requiresProfileCompletionByDefault
    );
  });

  async ngOnInit(): Promise<void> {
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });

    const token = this.route.snapshot.paramMap.get('token') ?? '';
    try {
      const loaded = await this.onboardingService.getInviteByToken(token);
      this.invite.set(loaded);

      const user = await this.authSession.waitForMxdUser();
      this.authenticatedUser.set(user);
    } catch {
      this.errorMessage.set('No se pudo validar la invitación.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async continueWithGoogle(): Promise<void> {
    const currentInvite = this.invite();
    if (!currentInvite || !isInviteActive(currentInvite)) {
      this.errorMessage.set('Esta invitación ya no es válida o ha expirado.');
      return;
    }

    this.isRedeeming.set(true);
    this.errorMessage.set('');
    try {
      const user = await this.authSession.loginWithGoogle();
      this.authenticatedUser.set(user);
      if (!user) {
        this.errorMessage.set('No se pudo completar la autenticación con Google.');
        return;
      }

      const userEmail = (user.email ?? '').trim().toLowerCase();
      if (userEmail !== currentInvite.email.trim().toLowerCase()) {
        this.errorMessage.set(
          `Iniciaste sesión como ${user.email}, pero esta invitación es para ${currentInvite.email}. Cambia de cuenta para continuar.`
        );
        return;
      }

      if (this.requiresProfileStep()) {
        this.profileForm.patchValue({
          displayName: user.displayName?.trim() || '',
        });
        this.awaitingProfileForm.set(true);
        return;
      }

      await this.finalizeAcceptance(currentInvite, user);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo activar la invitación.';
      this.errorMessage.set(message);
    } finally {
      this.isRedeeming.set(false);
    }
  }

  async submitProfileAndAccept(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const currentInvite = this.invite();
    const user = this.authenticatedUser();
    if (!currentInvite || !user) {
      return;
    }

    this.isRedeeming.set(true);
    this.errorMessage.set('');
    try {
      await this.finalizeAcceptance(
        currentInvite,
        user,
        this.profileForm.getRawValue().displayName
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo completar la activación del perfil.';
      this.errorMessage.set(message);
    } finally {
      this.isRedeeming.set(false);
    }
  }

  async switchAccount(): Promise<void> {
    await this.authSession.logout();
    this.authenticatedUser.set(null);
    this.awaitingProfileForm.set(false);
    this.errorMessage.set('');
  }

  private async finalizeAcceptance(
    invite: AdminInvite,
    user: MxdUser,
    displayName?: string
  ): Promise<void> {
    await this.onboardingService.acceptInviteForAuthenticatedUser(
      invite,
      user,
      displayName ? { displayName } : undefined
    );
    await this.router.navigateByUrl(this.config().postLoginRedirectUrl);
  }
}
