import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@marxa/auth-engine';

/**
 * Protects host-only routes by ensuring a Firebase Auth user is signed in.
 */
export const hostGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = await authService.waitForAuthReady();
  if (user) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

