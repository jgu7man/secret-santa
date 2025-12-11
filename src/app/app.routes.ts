import { Routes } from '@angular/router';
import { CreateEventComponent } from './components/create-event/create-event.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { EventLandingComponent } from './components/event-landing/event-landing.component';
import { PasswordResetComponent } from './components/password-reset/password-reset.component';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: CreateEventComponent },
  { path: 'event/:id', component: EventLandingComponent },
  { path: 'event/:id/admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'event/:id/reset/:participantId', component: PasswordResetComponent },
  { path: '**', redirectTo: '' }
];
