import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { EventService } from '../services/event.service';

export const adminGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot
) => {
  const eventService = inject(EventService);
  const router = inject(Router);
  const authService = inject(AuthService);

  const eventId = route.paramMap.get('id');

  if (!eventId) {
    router.navigate(['/']);
    return false;
  }

  // 1. Check stored token (Guest Host)
  const storedToken = eventService.getStoredAdminToken(eventId);
  if (storedToken) {
    const isValid = await eventService.verifyAdminToken(eventId, storedToken);
    if (isValid) return true;
  }

  // 2. Check authenticated user (Registered Host)
  const user = await firstValueFrom(authService.user$.pipe(take(1)));
  if (user) {
    const event = await eventService.getEvent(eventId);
    if (event && event.ownerId === user.uid) {
      return true;
    }
  }

  // If neither, redirect to Admin Login
  router.navigate(['/admin', eventId, 'login']);
  return false;
};
