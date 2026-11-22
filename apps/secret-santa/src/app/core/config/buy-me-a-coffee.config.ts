import {
  BuyMeACoffeeSettings,
  BuyMeACoffeeWidgetPosition,
} from '@secret-santa/shared-data-access';
import { SeoLocale } from './seo.config';

export { BuyMeACoffeeWidgetPosition };

/** DOM visibility state applied to `document.body` for the floating widget. */
export enum BuyMeACoffeeVisibilityState {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
}

/** Configuration contract for the Buy Me a Coffee floating widget script. */
export interface BuyMeACoffeeWidgetConfig extends BuyMeACoffeeSettings {
  readonly allowInTests: boolean;
  readonly scriptUrl: string;
  readonly integrity: string;
  readonly description: string;
  readonly message: string;
}

/** Localized static Buy Me a Coffee button metadata rendered on the landing page. */
export interface BuyMeACoffeeButtonConfig {
  readonly href: string;
  readonly imageSrc: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
}

const BUY_ME_A_COFFEE_SLUG = 'jgu7man';
const BUY_ME_A_COFFEE_WIDGET_URL =
  'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
const BUY_ME_A_COFFEE_WIDGET_SRI =
  'sha384-Ix5rVKHOmV5CEwVkvVF0OJsmX53F8y01q+sE3+b41ZLmPZWgufB7atrf9pwA7r1e';

/** Builds the default Buy Me a Coffee floating widget configuration. */
export function createDefaultBuyMeACoffeeConfig(): BuyMeACoffeeWidgetConfig {
  return {
    enabled: true,
    allowInTests: false,
    scriptUrl: BUY_ME_A_COFFEE_WIDGET_URL,
    integrity: BUY_ME_A_COFFEE_WIDGET_SRI,
    slug: BUY_ME_A_COFFEE_SLUG,
    description: $localize`:@@bmcWidgetDescription:Support me on Buy me a coffee!`,
    message: $localize`:@@bmcWidgetMessage:Thank you so much for your support! ☕💻 Messages and gifts like yours motivate me to keep building free, useful tools. Enjoy! 🎁🙌`,
    color: '#40DCA5',
    position: BuyMeACoffeeWidgetPosition.RIGHT,
    xMargin: 18,
    yMargin: 18,
  };
}

/** Builds the localized Buy Me a Coffee button attributes for the landing page. */
export function buildBuyMeACoffeeButtonConfig(
  locale: SeoLocale,
  slug: string = BUY_ME_A_COFFEE_SLUG
): BuyMeACoffeeButtonConfig {
  const isSpanish = locale === SeoLocale.ES_MX;
  const labelText = isSpanish ? 'Cómprame un café' : 'Buy me a coffee';
  const resolvedSlug = slug.trim() || BUY_ME_A_COFFEE_SLUG;
  const query = new URLSearchParams({
    text: labelText,
    emoji: '',
    slug: resolvedSlug,
    button_colour: 'FFDD00',
    font_colour: '000000',
    font_family: 'Bree',
    outline_colour: '000000',
    coffee_colour: 'ffffff',
  });

  return {
    href: `https://www.buymeacoffee.com/${encodeURIComponent(resolvedSlug)}`,
    imageSrc: `https://img.buymeacoffee.com/button-api/?${query.toString()}`,
    alt: $localize`:@@bmcButtonAlt:Buy me a coffee`,
    width: isSpanish ? 262 : 235,
    height: 50,
  };
}
