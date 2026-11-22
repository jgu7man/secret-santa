import { InjectionToken } from '@angular/core';
import {
  AnalyticsConfig,
  createDefaultAnalyticsConfig,
} from '@secret-santa/shared-core';
import {
  BuyMeACoffeeWidgetConfig,
  createDefaultBuyMeACoffeeConfig,
} from './buy-me-a-coffee.config';
import { APP_DESCRIPTION, APP_NAME } from './core.constants';
import { OpenGraphType, TwitterCardType } from './seo.config';

/** Configuration governing default SEO metadata values. */
export interface SeoConfig {
  readonly appName: string;
  readonly defaultDescription: string;
  readonly defaultOgType: OpenGraphType;
  readonly defaultTwitterCard: TwitterCardType;
}

/** Root configuration contract for the Secret Santa core module. */
export interface CoreConfig {
  readonly analytics: AnalyticsConfig;
  readonly seo: SeoConfig;
  readonly buyMeACoffee: BuyMeACoffeeWidgetConfig;
}

/** Partial override shape accepted by `provideCore`. */
export interface PartialCoreConfig {
  readonly analytics?: Partial<AnalyticsConfig>;
  readonly seo?: Partial<SeoConfig>;
  readonly buyMeACoffee?: Partial<BuyMeACoffeeWidgetConfig>;
}

/** Creates the default `CoreConfig` populated from Firebase options and localized constants. */
export function createDefaultCoreConfig(): CoreConfig {
  return {
    analytics: createDefaultAnalyticsConfig(),
    seo: {
      appName: APP_NAME,
      defaultDescription: APP_DESCRIPTION,
      defaultOgType: OpenGraphType.WEBSITE,
      defaultTwitterCard: TwitterCardType.SUMMARY_LARGE_IMAGE,
    },
    buyMeACoffee: createDefaultBuyMeACoffeeConfig(),
  };
}

/** Merges partial core overrides onto the default configuration without mutating defaults. */
export function mergeCoreConfig(overrides?: PartialCoreConfig): CoreConfig {
  const defaults = createDefaultCoreConfig();
  if (!overrides) {
    return defaults;
  }

  return {
    analytics: {
      ...defaults.analytics,
      ...(overrides.analytics ?? {}),
    },
    seo: {
      ...defaults.seo,
      ...(overrides.seo ?? {}),
    },
    buyMeACoffee: {
      ...defaults.buyMeACoffee,
      ...(overrides.buyMeACoffee ?? {}),
    },
  };
}

/** Injection token holding the active `CoreConfig`. */
export const CORE_CONFIG = new InjectionToken<CoreConfig>('CORE_CONFIG', {
  providedIn: 'root',
  factory: createDefaultCoreConfig,
});
