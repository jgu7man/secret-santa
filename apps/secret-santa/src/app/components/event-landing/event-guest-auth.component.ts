import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { ParticipantLogin } from '@secret-santa/domain';
import { User } from 'firebase/auth';
import { EventGuestLoginFormComponent } from './event-guest-login-form.component';
import { EventGuestRegisterFormComponent } from './event-guest-register-form.component';
import {
  EventGuestRegisterPayload,
  EventLandingTab,
  GooglePrefillData,
} from './event-landing-ui.model';

@Component({
  selector: 'app-event-guest-auth',
  standalone: true,
  imports: [EventGuestRegisterFormComponent, EventGuestLoginFormComponent],
  templateUrl: './event-guest-auth.component.html',
  styleUrl: './event-guest-auth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventGuestAuthComponent {
  protected readonly EventLandingTab = EventLandingTab;

  readonly isRegistrationOpen = input.required<boolean>();
  readonly isSubmitting = input.required<boolean>();
  readonly isGoogleLinked = input.required<boolean>();
  readonly currentUser = input<User | null>(null);
  readonly activeTab = input.required<EventLandingTab>();
  readonly googlePrefill = input<GooglePrefillData | null>(null);

  readonly tabChange = output<EventLandingTab>();
  readonly registerSubmit = output<EventGuestRegisterPayload>();
  readonly loginSubmit = output<ParticipantLogin>();
  readonly continueWithGoogleRegister = output<void>();
  readonly unlinkGoogle = output<void>();
  readonly loginWithGoogle = output<void>();
}
