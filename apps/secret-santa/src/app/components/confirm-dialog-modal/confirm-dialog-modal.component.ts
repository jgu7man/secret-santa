import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-confirm-dialog-modal',
  standalone: true,
  templateUrl: './confirm-dialog-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'cancelAction.emit()',
  },
})
export class ConfirmDialogModalComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input<string>($localize`:@@confirmButton:Confirm`);
  readonly confirmAction = output<void>();
  readonly cancelAction = output<void>();
}
