import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirestoreTimestampPipe } from '@secret-santa/shared-core';
import { AppUser, UserRole, UserStatus } from '@marxa/auth-domain';
import {
  USER_STATUS_ACTION_BUTTONS,
  USER_STATUS_BADGES,
} from '../../models/crew-ui.model';

/** Payload emitted when an admin changes a user's role. */
export interface UserRoleChangeEvent {
  readonly user: AppUser;
  readonly rawRole: string;
}

/** Payload emitted when an admin saves internal notes for a user. */
export interface UserNotesSaveEvent {
  readonly user: AppUser;
  readonly notes: string;
}

/**
 * Presentational tab rendering the Crew user directory with search,
 * role/status filters, inline notes editing, and status toggling.
 */
@Component({
  selector: 'marxa-crew-directory-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, FirestoreTimestampPipe],
  templateUrl: './crew-directory-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrewDirectoryTabComponent {
  readonly users = input.required<ReadonlyArray<AppUser>>();
  readonly totalUsersCount = input.required<number>();
  readonly adminCount = input.required<number>();
  readonly suspendedCount = input.required<number>();
  readonly isLoading = input.required<boolean>();
  readonly savingId = input.required<string | null>();
  readonly currentUid = input.required<string | null>();
  readonly searchQuery = input.required<string>();
  readonly roleFilter = input.required<string>();
  readonly statusFilter = input.required<string>();
  readonly roles = input.required<ReadonlyArray<UserRole>>();
  readonly statuses = input.required<ReadonlyArray<UserStatus>>();

  readonly searchQueryChange = output<string>();
  readonly roleFilterChange = output<string>();
  readonly statusFilterChange = output<string>();
  readonly roleChange = output<UserRoleChangeEvent>();
  readonly toggleStatus = output<AppUser>();
  readonly saveNotes = output<UserNotesSaveEvent>();

  protected readonly UserStatus = UserStatus;
  protected readonly statusBadges = USER_STATUS_BADGES;
  protected readonly actionButtons = USER_STATUS_ACTION_BUTTONS;
  protected readonly editingNotesUid = signal<string | null>(null);
  protected readonly notesDraft = signal('');

  startEditNotes(user: AppUser): void {
    this.editingNotesUid.set(user.uid);
    this.notesDraft.set(user.notes ?? '');
  }

  cancelEditNotes(): void {
    this.editingNotesUid.set(null);
    this.notesDraft.set('');
  }

  submitNotes(user: AppUser): void {
    this.saveNotes.emit({ user, notes: this.notesDraft().trim() });
    this.cancelEditNotes();
  }
}
