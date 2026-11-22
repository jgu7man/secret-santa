export {
  AnalyticsAuthMethod,
  AnalyticsEventName,
} from './lib/config/analytics.config';
export type { AnalyticsEventParams } from './lib/config/analytics.config';
export {
  ANALYTICS_CONFIG,
  ANALYTICS_SDK,
  createDefaultAnalyticsConfig,
  createDefaultAnalyticsSdk,
  readValidMeasurementId,
} from './lib/config/analytics.tokens';
export type {
  AnalyticsConfig,
  AnalyticsSdkAdapter,
} from './lib/config/analytics.tokens';
export {
  CONFIG_PLACEHOLDER_PREFIX,
  GA_MEASUREMENT_ID_PATTERN,
  LOCAL_HOSTNAMES,
  LONG_MESSAGE_DISPLAY_DURATION,
  MESSAGE_DISPLAY_DURATION,
  stripRouteQueryAndHash,
} from './lib/config/core.constants';
export { ActiveClassPipe, UI_PILL_TOKENS } from './lib/pipes/active-class.pipe';
export type { UiPillTokens } from './lib/pipes/active-class.pipe';
export { FirestoreTimestampPipe } from './lib/pipes/firestore-timestamp.pipe';
export {
  AnalyticsService,
  isAnalyticsBlockedEnvironment,
  isValidMeasurementId,
  sanitizeAnalyticsPath,
} from './lib/services/analytics.service';
export {
  ErrorCategory,
  GlobalErrorHandler,
  normalizeUnknownError,
  sanitizeErrorMessage,
} from './lib/services/global-error-handler.service';
export type { NormalizedAppError } from './lib/services/global-error-handler.service';

