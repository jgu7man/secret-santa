/**
 * Analytics event catalog and privacy-safe parameter types.
 */

/** Canonical analytics event identifiers tracked across the application. */
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
export type AnalyticsEventParams = Record<string, string | number | boolean | undefined>;

