import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { EventService } from '../services/event.service';

export const adminGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const eventService = inject(EventService);
  const router = inject(Router);
  
  const eventId = route.paramMap.get('id');
  
  if (!eventId) {
    router.navigate(['/']);
    return false;
  }

  // Get stored token
  const storedToken = eventService.getStoredAdminToken(eventId);
  
  if (!storedToken) {
    router.navigate(['/event', eventId]);
    return false;
  }

  // Verify token against database
  const isValid = await eventService.verifyAdminToken(eventId, storedToken);
  
  if (!isValid) {
    router.navigate(['/event', eventId]);
    return false;
  }

  return true;
};
