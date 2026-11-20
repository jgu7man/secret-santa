import { InjectionToken } from '@angular/core';
import {
  Analytics,
  AnalyticsSettings,
  initializeAnalytics,
  isSupported,
  logEvent as firebaseLogEvent,
} from 'firebase/analytics';
import { FirebaseApp } from 'firebase/app';
import { auth } from '../../firebase-config';
import { AnalyticsEventName, AnalyticsEventParams } from './analytics.config';
import {
  BuyMeACoffeeWidgetConfig,
  createDefaultBuyMeACoffeeConfig,
} from './buy-me-a-coffee.config';
import {
  APP_DESCRIPTION,
  APP_NAME,
  CONFIG_PLACEHOLDER_PREFIX,
  GA_MEASUREMENT_ID_PATTERN,
} from './core.constants';
import { OpenGraphType, TwitterCardType } from './seo.config';

/** Configuration governing analytics initialization and localhost/test filtering. */
export interface AnalyticsConfig {
  readonly enabled: boolean;
  readonly allowLocalhost: boolean;
  readonly measurementId?: string;
}

/** Configuration governing default SEO metadata values. */
export interface SeoConfig {
  readonly appName: string;
  readonly defaultDescription: string;
  readonly defaultOgType: OpenGraphType;
  readonly defaultTwitterCard: TwitterCardType;
}

/** Root configuration contract for the core module. */
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

/** Injectable adapter wrapping Firebase Analytics SDK functions for testability. */
export interface AnalyticsSdkAdapter {
  isSupported(): Promise<boolean>;
  initializeAnalytics(app: FirebaseApp, options?: AnalyticsSettings): Analytics;
  logEvent(
    analyticsInstance: Analytics,
    eventName: AnalyticsEventName,
    eventParams?: AnalyticsEventParams
  ): void;
}

function readValidMeasurementId(rawValue: unknown): string | undefined {
  if (typeof rawValue !== 'string') {
    return undefined;
  }
  const trimmed = rawValue.trim();
  if (
    !trimmed ||
    trimmed.startsWith(CONFIG_PLACEHOLDER_PREFIX) ||
    !GA_MEASUREMENT_ID_PATTERN.test(trimmed)
  ) {
    return undefined;
  }
  return trimmed;
}

/** Creates the default `CoreConfig` populated from Firebase options and localized constants. */
export function createDefaultCoreConfig(): CoreConfig {
  return {
    analytics: {
      enabled: true,
      allowLocalhost: false,
      measurementId: readValidMeasurementId(auth.app.options.measurementId),
    },
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

/** Default adapter delegating directly to the modular `firebase/analytics` SDK. */
export function createDefaultAnalyticsSdk(): AnalyticsSdkAdapter {
  return {
    isSupported: () => isSupported(),
    initializeAnalytics: (app: FirebaseApp, options?: AnalyticsSettings) =>
      initializeAnalytics(app, options),
    logEvent: (
      analyticsInstance: Analytics,
      eventName: AnalyticsEventName,
      eventParams?: AnalyticsEventParams
    ) => {
      switch (eventName) {
        case AnalyticsEventName.PAGE_VIEW:
          firebaseLogEvent(analyticsInstance, 'page_view', eventParams);
          return;
        case AnalyticsEventName.LOGIN:
          firebaseLogEvent(analyticsInstance, 'login', eventParams);
          return;
        case AnalyticsEventName.APP_EXCEPTION:
          firebaseLogEvent(analyticsInstance, 'exception', eventParams);
          return;
        case AnalyticsEventName.LOGOUT:
        case AnalyticsEventName.EVENT_CREATED:
        case AnalyticsEventName.PARTICIPANT_REGISTERED:
        case AnalyticsEventName.RAFFLE_DRAWN:
        case AnalyticsEventName.MATCH_REVEALED:
          firebaseLogEvent(analyticsInstance, eventName, eventParams);
          return;
      }
    },
  };
}

/** Injection token holding the active `CoreConfig`. */
export const CORE_CONFIG = new InjectionToken<CoreConfig>('CORE_CONFIG', {
  providedIn: 'root',
  factory: createDefaultCoreConfig,
});

/** Injection token providing the active `FirebaseApp` instance. */
export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP', {
  providedIn: 'root',
  factory: () => auth.app,
});

/** Injection token providing the `AnalyticsSdkAdapter`. */
export const ANALYTICS_SDK = new InjectionToken<AnalyticsSdkAdapter>(
  'ANALYTICS_SDK',
  {
    providedIn: 'root',
    factory: createDefaultAnalyticsSdk,
  }
);

