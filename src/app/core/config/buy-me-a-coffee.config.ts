import { SeoLocale } from './seo.config';

/** Supported horizontal placement options for the Buy Me a Coffee floating widget. */
export enum BuyMeACoffeeWidgetPosition {
  LEFT = 'Left',
  RIGHT = 'Right',
}

/** DOM visibility state applied to `document.body` for the floating widget. */
export enum BuyMeACoffeeVisibilityState {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
}

/** Configuration contract for the Buy Me a Coffee floating widget script. */
export interface BuyMeACoffeeWidgetConfig {
  readonly enabled: boolean;
  readonly allowInTests: boolean;
  readonly scriptUrl: string;
  readonly integrity: string;
  readonly slug: string;
  readonly description: string;
  readonly message: string;
  readonly color: string;
  readonly position: BuyMeACoffeeWidgetPosition;
  readonly xMargin: number;
  readonly yMargin: number;
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
const BUY_ME_A_COFFEE_PROFILE_URL = `https://www.buymeacoffee.com/${BUY_ME_A_COFFEE_SLUG}`;
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
  locale: SeoLocale
): BuyMeACoffeeButtonConfig {
  const isSpanish = locale === SeoLocale.ES_MX;
  const labelText = isSpanish ? 'Cómprame un café' : 'Buy me a coffee';
  const query = new URLSearchParams({
    text: labelText,
    emoji: '',
    slug: BUY_ME_A_COFFEE_SLUG,
    button_colour: 'FFDD00',
    font_colour: '000000',
    font_family: 'Bree',
    outline_colour: '000000',
    coffee_colour: 'ffffff',
  });

  return {
    href: BUY_ME_A_COFFEE_PROFILE_URL,
    imageSrc: `https://img.buymeacoffee.com/button-api/?${query.toString()}`,
    alt: $localize`:@@bmcButtonAlt:Buy me a coffee`,
    width: isSpanish ? 262 : 235,
    height: 50,
  };
}

