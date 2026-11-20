import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Analytics } from 'firebase/analytics';
import {
  AnalyticsAuthMethod,
  AnalyticsEventName,
  AnalyticsEventParams,
} from '../config/analytics.config';
import {
  CONFIG_PLACEHOLDER_PREFIX,
  GA_MEASUREMENT_ID_PATTERN,
  LOCAL_HOSTNAMES,
} from '../config/core.constants';
import {
  ANALYTICS_SDK,
  CORE_CONFIG,
  FIREBASE_APP,
} from '../config/core.tokens';
import { stripRouteQueryAndHash } from '../config/seo.config';

const RESET_PARTICIPANT_SEGMENT_PATTERN = /^(\/event\/[^/]+\/reset\/)[^/]+/;
const MAX_EXCEPTION_DESCRIPTION_LENGTH = 150;

/** Validates that a GA4 measurement ID is present and not an example placeholder. */
export function isValidMeasurementId(
  measurementId: string | undefined
): measurementId is string {
  if (typeof measurementId !== 'string') {
    return false;
  }
  const trimmed = measurementId.trim();
  return (
    trimmed.length > 0 &&
    !trimmed.startsWith(CONFIG_PLACEHOLDER_PREFIX) &&
    GA_MEASUREMENT_ID_PATTERN.test(trimmed)
  );
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

/** Strips query params, hashes, and sensitive participant reset segments from tracked route paths. */
export function sanitizeAnalyticsPath(rawUrl: string): string {
  const clean = stripRouteQueryAndHash(rawUrl);
  const withLeadingSlash = clean.startsWith('/') ? clean : `/${clean}`;
  return withLeadingSlash.replace(
    RESET_PARTICIPANT_SEGMENT_PATTERN,
    '$1:participantId'
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
  private readonly coreConfig = inject(CORE_CONFIG);
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

    const sanitizedPath = sanitizeAnalyticsPath(rawUrl);
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

  /** Logs a named analytics event after verifying SDK readiness. */
  async trackEvent(
    eventName: AnalyticsEventName,
    params?: AnalyticsEventParams
  ): Promise<void> {
    const ready = await this.initialize();
    if (!ready || !this.analyticsInstance) {
      return;
    }

    this.safeLogEvent(eventName, params);
  }

  /** Logs a sign-in event with the authentication provider method. */
  trackLogin(method: AnalyticsAuthMethod): Promise<void> {
    return this.trackEvent(AnalyticsEventName.LOGIN, { method });
  }

  /** Logs a sign-out event. */
  trackLogout(): Promise<void> {
    return this.trackEvent(AnalyticsEventName.LOGOUT);
  }

  /** Logs event creation without exposing private event names or tokens. */
  trackEventCreated(isGuest: boolean): Promise<void> {
    return this.trackEvent(AnalyticsEventName.EVENT_CREATED, {
      is_guest: isGuest,
    });
  }

  /** Logs participant registration with authentication linkage metadata only. */
  trackParticipantRegistered(isGoogleLinked: boolean): Promise<void> {
    return this.trackEvent(AnalyticsEventName.PARTICIPANT_REGISTERED, {
      method: isGoogleLinked
        ? AnalyticsAuthMethod.GOOGLE
        : AnalyticsAuthMethod.SECRET_WORD,
    });
  }

  /** Logs completion of a Secret Santa raffle draw with participant count. */
  trackRaffleDrawn(participantCount: number): Promise<void> {
    return this.trackEvent(AnalyticsEventName.RAFFLE_DRAWN, {
      participant_count: participantCount,
    });
  }

  /** Logs that a participant revealed their assigned match. */
  trackMatchRevealed(): Promise<void> {
    return this.trackEvent(AnalyticsEventName.MATCH_REVEALED);
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

    const { enabled, allowLocalhost, measurementId } =
      this.coreConfig.analytics;
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

