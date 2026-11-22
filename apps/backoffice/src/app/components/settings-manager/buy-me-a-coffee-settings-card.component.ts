import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BuyMeACoffeeWidgetPosition } from '@secret-santa/shared-data-access';

export type BuyMeACoffeeSettingsFormGroup = FormGroup<{
  enabled: FormControl<boolean>;
  slug: FormControl<string>;
  color: FormControl<string>;
  position: FormControl<BuyMeACoffeeWidgetPosition>;
  xMargin: FormControl<number>;
  yMargin: FormControl<number>;
}>;

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
