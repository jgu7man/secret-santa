import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { Participant } from '@secret-santa/domain';

@Component({
  selector: 'app-admin-participants-table',
  standalone: true,
  templateUrl: './admin-participants-table.component.html',
  styleUrl: './admin-participants-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminParticipantsTableComponent {
  readonly participants = input.required<readonly Participant[]>();
  readonly canRevealResults = input.required<boolean>();
  readonly copyResetLink = output<string>();
  readonly deleteParticipant = output<string>();
}
