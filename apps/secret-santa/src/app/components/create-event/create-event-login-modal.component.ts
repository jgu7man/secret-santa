import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-create-event-login-modal',
  standalone: true,
  templateUrl: './create-event-login-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'cancelModal.emit()',
  },
})
export class CreateEventLoginModalComponent {
  readonly loginAndContinue = output<void>();
  readonly continueAsGuest = output<void>();
  readonly cancelModal = output<void>();
}
