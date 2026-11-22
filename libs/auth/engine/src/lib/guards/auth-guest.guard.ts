import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionStatus } from '../models/access-onboarding.model';
import { AuthRuntimeConfigService } from '../services/auth-runtime-config.service';
import { AuthSessionService } from '../services/auth-session.service';

/**
 * Guards guest/login routes: redirects already-authenticated active admins
 * straight to `config.postLoginRedirectUrl`, and signs out unauthorized sessions.
 */
export const authGuestGuard: CanActivateFn = async () => {
  const authSession = inject(AuthSessionService);
  const config = inject(AuthRuntimeConfigService).config();
  const router = inject(Router);

  const status = await authSession.verifyOrLogoutAdmin();
  if (status === AuthSessionStatus.AUTHORIZED) {
    return router.createUrlTree([config.postLoginRedirectUrl]);
  }

  return true;
};
