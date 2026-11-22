/**
 * Analytics event catalog and privacy-safe parameter types.
 */

/** Canonical analytics event identifiers tracked across the platform. */
export enum AnalyticsEventName {
  PAGE_VIEW = 'page_view',
  LOGIN = 'login',
  APP_EXCEPTION = 'exception',
  LOGOUT = 'logout',
  EVENT_CREATED = 'event_created',
  PARTICIPANT_REGISTERED = 'participant_registered',
  RAFFLE_DRAWN = 'raffle_drawn',
  MATCH_REVEALED = 'match_revealed',
}

/** Supported authentication methods reported to analytics. */
export enum AnalyticsAuthMethod {
  GOOGLE = 'google',
  SECRET_WORD = 'secret_word',
}

/** Primitive-only analytics parameter map avoiding nested objects or PII blobs. */
export type AnalyticsEventParams = Record<
  string,
  string | number | boolean | undefined
>;

/** Strict parameter contract per canonical `AnalyticsEventName`. */
export interface AnalyticsEventPayloadMap {
  [AnalyticsEventName.PAGE_VIEW]: {
    page_title: string;
    page_path: string;
    page_location?: string;
  };
  [AnalyticsEventName.LOGIN]: { method: AnalyticsAuthMethod };
  [AnalyticsEventName.LOGOUT]: undefined;
  [AnalyticsEventName.APP_EXCEPTION]: { description: string; fatal: boolean };
  [AnalyticsEventName.EVENT_CREATED]: { is_guest: boolean };
  [AnalyticsEventName.PARTICIPANT_REGISTERED]: { method: AnalyticsAuthMethod };
  [AnalyticsEventName.RAFFLE_DRAWN]: { participant_count: number };
  [AnalyticsEventName.MATCH_REVEALED]: undefined;
}

/** Rule for redacting sensitive URL path segments before sending `page_path`. */
export interface AnalyticsPathRedactionRule {
  readonly pattern: RegExp;
  readonly replacement: string;
}
