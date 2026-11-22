import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-admin-raffle-confirm-modal',
  standalone: true,
  templateUrl: './admin-raffle-confirm-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'cancelRaffle.emit()',
  },
})
export class AdminRaffleConfirmModalComponent {
  readonly isDrawn = input.required<boolean>();
  readonly confirmRaffle = output<void>();
  readonly cancelRaffle = output<void>();
}
