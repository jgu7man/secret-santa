import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AccessRequest,
  AccessRequestStatus,
  AdminInvite,
  AdminInviteStatus,
} from '@marxa/auth-engine';
import { FirestoreTimestampPipe } from '@secret-santa/shared-core';
import { UserRole } from '@secret-santa/shared-models';
import {
  ACCESS_REQUEST_STATUS_BADGES,
  ADMIN_INVITE_STATUS_BADGES,
} from '../../models/crew-ui.model';

/** Payload emitted when an admin creates a direct invitation link. */
export interface DirectInviteSubmitEvent {
  readonly email: string;
  readonly targetRole: UserRole;
  readonly requiresProfileCompletion: boolean;
}

/**
 * Presentational tab rendering direct email invitation creation,
 * pending access request moderation, and issued invite history.
 */
@Component({
  selector: 'marxa-crew-onboarding-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FirestoreTimestampPipe],
  templateUrl: './crew-onboarding-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrewOnboardingTabComponent {
  private readonly fb = inject(FormBuilder);

  readonly accessRequests = input.required<ReadonlyArray<AccessRequest>>();
  readonly invites = input.required<ReadonlyArray<AdminInvite>>();
  readonly roles = input.required<ReadonlyArray<UserRole>>();
  readonly defaultTargetRole = input.required<UserRole>();
  readonly defaultRequiresProfile = input.required<boolean>();
  readonly requestAccessRoute = input.required<string>();
  readonly savingId = input.required<string | null>();
  readonly lastGeneratedInviteUrl = input.required<string>();

  readonly createDirectInvite = output<DirectInviteSubmitEvent>();
  readonly approveRequest = output<AccessRequest>();
  readonly rejectRequest = output<AccessRequest>();
  readonly revokeInvite = output<AdminInvite>();
  readonly copyInviteLink = output<string>();

  protected readonly AccessRequestStatus = AccessRequestStatus;
  protected readonly AdminInviteStatus = AdminInviteStatus;
  protected readonly requestBadges = ACCESS_REQUEST_STATUS_BADGES;
  protected readonly inviteBadges = ADMIN_INVITE_STATUS_BADGES;

  readonly inviteForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    targetRole: [UserRole.ADMIN, [Validators.required]],
    requiresProfileCompletion: [false],
  });

  submitDirectInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    const { email, targetRole, requiresProfileCompletion } =
      this.inviteForm.getRawValue();
    this.createDirectInvite.emit({
      email,
      targetRole,
      requiresProfileCompletion,
    });
    this.inviteForm.reset({
      email: '',
      targetRole: this.defaultTargetRole(),
      requiresProfileCompletion: this.defaultRequiresProfile(),
    });
  }
}
