import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { OperationsSettingsFormGroup } from './settings-manager-ui.model';

@Component({
  selector: 'bo-operations-settings-card',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './operations-settings-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationsSettingsCardComponent {
  readonly form = input.required<OperationsSettingsFormGroup>();
}
