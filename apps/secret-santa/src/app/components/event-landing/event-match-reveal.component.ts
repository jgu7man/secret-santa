import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Participant } from '@secret-santa/domain';

@Component({
  selector: 'app-event-match-reveal',
  standalone: true,
  templateUrl: './event-match-reveal.component.html',
  styleUrl: './event-match-reveal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventMatchRevealComponent {
  readonly isDrawn = input.required<boolean>();
  readonly assignedParticipant = input<Participant | null>(null);
}
