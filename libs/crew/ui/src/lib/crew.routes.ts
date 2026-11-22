import { Routes } from '@angular/router';

/** Standard white-label Crew management routes. */
export const CREW_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/crew-manager/crew-manager.component').then(
        (m) => m.CrewManagerComponent
      ),
  },
];
