import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BuyMeACoffeeWidgetPosition } from '@secret-santa/shared-data-access';
import { BuyMeACoffeeSettingsFormGroup } from './settings-manager-ui.model';

@Component({
  selector: 'bo-buy-me-a-coffee-settings-card',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './buy-me-a-coffee-settings-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuyMeACoffeeSettingsCardComponent {
  readonly form = input.required<BuyMeACoffeeSettingsFormGroup>();
  protected readonly positions: ReadonlyArray<BuyMeACoffeeWidgetPosition> = [
    BuyMeACoffeeWidgetPosition.LEFT,
    BuyMeACoffeeWidgetPosition.RIGHT,
  ];
}
