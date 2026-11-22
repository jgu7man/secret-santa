import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { FIREBASE_APP } from '@secret-santa/shared-firebase';
import { Analytics } from 'firebase/analytics';
import {
  AnalyticsEventName,
  AnalyticsEventParams,
  AnalyticsEventPayloadMap,
  AnalyticsPathRedactionRule,
} from '../config/analytics.config';
import {
  ANALYTICS_CONFIG,
  ANALYTICS_SDK,
  readValidMeasurementId,
} from '../config/analytics.tokens';
import {
  LOCAL_HOSTNAMES,
  stripRouteQueryAndHash,
} from '../config/core.constants';

const MAX_EXCEPTION_DESCRIPTION_LENGTH = 150;

/** Validates that a GA4 measurement ID is present and not an example placeholder. */
export function isValidMeasurementId(
  measurementId: string | undefined
): measurementId is string {
  return readValidMeasurementId(measurementId) !== undefined;
}

/** Checks whether the current runtime is a local or test environment where analytics must stay disabled. */
export function isAnalyticsBlockedEnvironment(
  win: Window | null,
  hostname: string,
  allowLocalhost: boolean
): boolean {
  if (allowLocalhost) {
    return false;
  }
  const normalizedHost = hostname.trim().toLowerCase();
  const isKarmaRunner = win !== null && '__karma__' in win;
  return (
    isKarmaRunner ||
    !normalizedHost ||
    LOCAL_HOSTNAMES.has(normalizedHost) ||
    normalizedHost.endsWith('.local')
  );
}

/** Strips query params, hashes, and configured sensitive segments from tracked route paths. */
export function sanitizeAnalyticsPath(
  rawUrl: string,
  redactionRules: ReadonlyArray<AnalyticsPathRedactionRule> = []
): string {
  const clean = stripRouteQueryAndHash(rawUrl);
  const withLeadingSlash = clean.startsWith('/') ? clean : `/${clean}`;
  return redactionRules.reduce(
    (path, rule) => path.replace(rule.pattern, rule.replacement),
    withLeadingSlash
  );
}

/**
 * Privacy-aware Firebase Google Analytics service supporting automatic route tracking
 * and safe no-op behavior on localhost, tests, SSR, or unsupported browsers.
 */
@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly analyticsConfig = inject(ANALYTICS_CONFIG);
  private readonly firebaseApp = inject(FIREBASE_APP);
  private readonly analyticsSdk = inject(ANALYTICS_SDK);

  private analyticsInstance: Analytics | null = null;
  private initializationPromise: Promise<boolean> | null = null;
  private lastTrackedPath: string | null = null;

  /** Initializes Firebase Analytics once when supported and permitted by environment rules. */
  initialize(): Promise<boolean> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialize();
    return this.initializationPromise;
  }

  /** Returns true once Firebase Analytics has initialized successfully. */
  isEnabled(): boolean {
    return this.analyticsInstance !== null;
  }

  /** Tracks a deduplicated, sanitized `page_view` event for the active route. */
  async trackPageView(rawUrl: string, pageTitle: string): Promise<void> {
    const ready = await this.initialize();
    if (!ready || !this.analyticsInstance) {
      return;
    }

    const sanitizedPath = sanitizeAnalyticsPath(
      rawUrl,
      this.analyticsConfig.pathRedactionRules ?? []
    );
    if (this.lastTrackedPath === sanitizedPath) {
      return;
    }
    this.lastTrackedPath = sanitizedPath;

    const origin = this.document.location?.origin;
    const pageLocation =
      origin && origin !== 'null' ? `${origin}${sanitizedPath}` : undefined;

    const params: AnalyticsEventParams = {
      page_title: pageTitle,
      page_path: sanitizedPath,
      page_location: pageLocation,
    };

    this.safeLogEvent(AnalyticsEventName.PAGE_VIEW, params);
  }

  /** Logs a typed analytics event from `AnalyticsEventName` after verifying SDK readiness. */
  async trackEvent<K extends AnalyticsEventName>(
    eventName: K,
    params?: AnalyticsEventPayloadMap[K]
  ): Promise<void> {
    const ready = await this.initialize();
    if (!ready || !this.analyticsInstance) {
      return;
    }

    this.safeLogEvent(eventName, params);
  }

  /** Logs a sanitized application exception to Google Analytics. */
  trackException(description: string, fatal = false): Promise<void> {
    const boundedDescription = description.slice(
      0,
      MAX_EXCEPTION_DESCRIPTION_LENGTH
    );
    return this.trackEvent(AnalyticsEventName.APP_EXCEPTION, {
      description: boundedDescription,
      fatal,
    });
  }

  private async performInitialize(): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const { enabled, allowLocalhost, measurementId } = this.analyticsConfig;
    if (!enabled || !isValidMeasurementId(measurementId)) {
      return false;
    }

    const win = this.document.defaultView;
    const hostname = this.document.location?.hostname ?? '';
    if (isAnalyticsBlockedEnvironment(win, hostname, allowLocalhost)) {
      return false;
    }

    try {
      const supported = await this.analyticsSdk.isSupported();
      if (!supported) {
        return false;
      }

      this.analyticsInstance = this.analyticsSdk.initializeAnalytics(
        this.firebaseApp,
        {
          config: {
            send_page_view: false,
          },
        }
      );
      return true;
    } catch {
      this.analyticsInstance = null;
      return false;
    }
  }

  private safeLogEvent(
    eventName: AnalyticsEventName,
    params?: AnalyticsEventParams
  ): void {
    if (!this.analyticsInstance) {
      return;
    }
    try {
      this.analyticsSdk.logEvent(this.analyticsInstance, eventName, params);
    } catch {
      // Never allow analytics transport failures to disrupt user flows.
    }
  }
}
