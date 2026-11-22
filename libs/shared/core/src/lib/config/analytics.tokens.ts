import { InjectionToken } from '@angular/core';
import { auth } from '@secret-santa/shared-firebase';
import {
  Analytics,
  AnalyticsSettings,
  initializeAnalytics,
  isSupported,
  logEvent as firebaseLogEvent,
} from 'firebase/analytics';
import { FirebaseApp } from 'firebase/app';
import {
  AnalyticsEventName,
  AnalyticsEventParams,
  AnalyticsPathRedactionRule,
} from './analytics.config';
import {
  CONFIG_PLACEHOLDER_PREFIX,
  GA_MEASUREMENT_ID_PATTERN,
} from './core.constants';

/** Configuration governing analytics initialization and localhost/test filtering. */
export interface AnalyticsConfig {
  readonly enabled: boolean;
  readonly allowLocalhost: boolean;
  readonly measurementId?: string;
  readonly pathRedactionRules?: ReadonlyArray<AnalyticsPathRedactionRule>;
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

/** Validates and extracts a non-placeholder GA4 measurement ID. */
export function readValidMeasurementId(rawValue: unknown): string | undefined {
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

/** Creates the default `AnalyticsConfig` populated from Firebase options. */
export function createDefaultAnalyticsConfig(): AnalyticsConfig {
  return {
    enabled: true,
    allowLocalhost: false,
    measurementId: readValidMeasurementId(auth.app.options.measurementId),
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
      const wireEventName: string = eventName;
      firebaseLogEvent(analyticsInstance, wireEventName, eventParams);
    },
  };
}

/** Injection token holding the active `AnalyticsConfig`. */
export const ANALYTICS_CONFIG = new InjectionToken<AnalyticsConfig>(
  'ANALYTICS_CONFIG',
  {
    providedIn: 'root',
    factory: createDefaultAnalyticsConfig,
  }
);

/** Injection token providing the `AnalyticsSdkAdapter`. */
export const ANALYTICS_SDK = new InjectionToken<AnalyticsSdkAdapter>(
  'ANALYTICS_SDK',
  {
    providedIn: 'root',
    factory: createDefaultAnalyticsSdk,
  }
);
