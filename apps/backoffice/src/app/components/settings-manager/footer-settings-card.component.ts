import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { formatFooterWhatsappLabel } from '@secret-santa/shared-data-access';
import { FooterSettingsFormGroup } from './settings-manager-ui.model';

@Component({
  selector: 'bo-footer-settings-card',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './footer-settings-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterSettingsCardComponent {
  readonly form = input.required<FooterSettingsFormGroup>();

  protected fillWhatsappDisplayIfEmpty(): void {
    const controls = this.form().controls;
    if (controls.whatsappDisplay.value.trim()) {
      return;
    }

    const deduced = formatFooterWhatsappLabel(controls.whatsappNumber.value);
    if (deduced) {
      controls.whatsappDisplay.setValue(deduced);
    }
  }
}
