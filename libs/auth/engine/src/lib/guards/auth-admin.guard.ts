import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionStatus } from '@marxa/auth-domain';
import { AuthRuntimeConfigService } from '../services/auth-runtime-config.service';
import { AuthSessionService } from '../services/auth-session.service';

/**
 * Protects administrative routes by delegating to `AuthSessionService`.
 * Redirects unauthenticated or unauthorized users to `config.loginRoute`.
 */
export const authAdminGuard: CanActivateFn = async () => {
  const authSession = inject(AuthSessionService);
  const config = inject(AuthRuntimeConfigService).config();
  const router = inject(Router);

  const status = await authSession.verifyOrLogoutAdmin();
  if (status === AuthSessionStatus.AUTHORIZED) {
    return true;
  }

  if (status === AuthSessionStatus.UNAUTHORIZED) {
    return router.createUrlTree([config.loginRoute], {
      queryParams: { reason: 'unauthorized' },
    });
  }

  return router.createUrlTree([config.loginRoute]);
};
