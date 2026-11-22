import { ErrorHandler, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@marxa/auth-engine';
import { EventService } from '@secret-santa/data-access';

/**
 * Protects event administration routes via stored admin token or verified Firebase owner auth.
 */
export const adminGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot
) => {
  const eventService = inject(EventService);
  const router = inject(Router);
  const authService = inject(AuthService);
  const errorHandler = inject(ErrorHandler);

  const eventId = route.paramMap.get('id');

  if (!eventId) {
    return router.createUrlTree(['/']);
  }

  try {
    // 1. Check stored token (Guest Host)
    const storedToken = eventService.getStoredAdminToken(eventId);
    if (storedToken) {
      const isValid = await eventService.verifyAdminToken(eventId, storedToken);
      if (isValid) {
        return true;
      }
    }

    // 2. Check authenticated user (Registered Host)
    const user = await authService.waitForAuthReady();
    if (user) {
      const event = await eventService.getEvent(eventId);
      if (event && event.ownerId === user.uid) {
        return true;
      }
    }
  } catch (error: unknown) {
    errorHandler.handleError(error);
  }

  // If neither, redirect to Admin Login
  return router.createUrlTree(['/admin', eventId, 'login']);
};
