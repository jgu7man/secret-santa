export { AnalyticsAuthMethod, AnalyticsEventName } from './config/analytics.config';
export type { AnalyticsEventParams } from './config/analytics.config';
export {
  BuyMeACoffeeVisibilityState,
  BuyMeACoffeeWidgetPosition,
  buildBuyMeACoffeeButtonConfig,
  createDefaultBuyMeACoffeeConfig,
} from './config/buy-me-a-coffee.config';
export type {
  BuyMeACoffeeButtonConfig,
  BuyMeACoffeeWidgetConfig,
} from './config/buy-me-a-coffee.config';
export {
  APP_DESCRIPTION,
  APP_NAME,
  CONFIG_PLACEHOLDER_PREFIX,
  GA_MEASUREMENT_ID_PATTERN,
  LOCAL_HOSTNAMES,
  LONG_MESSAGE_DISPLAY_DURATION,
  MESSAGE_DISPLAY_DURATION,
} from './config/core.constants';
export {
  ANALYTICS_SDK,
  CORE_CONFIG,
  FIREBASE_APP,
  createDefaultAnalyticsSdk,
  createDefaultCoreConfig,
  mergeCoreConfig,
} from './config/core.tokens';
export type {
  AnalyticsConfig,
  AnalyticsSdkAdapter,
  CoreConfig,
  PartialCoreConfig,
  SeoConfig,
} from './config/core.tokens';
export {
  OpenGraphType,
  RobotsDirective,
  SEO_LOCALES,
  SeoLocale,
  SeoRouteKey,
  TwitterCardType,
  buildLocalizedUrl,
  buildSeoUrls,
  isSeoRouteKey,
  normalizeAppPath,
  resolveLocaleFromId,
  resolveRouteSeoMetadata,
  stripRouteQueryAndHash,
} from './config/seo.config';
export type {
  ResolvedSeoUrls,
  RouteSeoMetadata,
  SeoLocaleDescriptor,
} from './config/seo.config';
export { provideCore } from './core.providers';
export { adminGuard } from './guards/admin.guard';
export { hostGuard } from './guards/host.guard';
export { AnalyticsService } from './services/analytics.service';
export { AuthService } from './services/auth.service';
export { BuyMeACoffeeService } from './services/buy-me-a-coffee.service';
export {
  ErrorCategory,
  GlobalErrorHandler,
} from './services/global-error-handler.service';
export type { NormalizedAppError } from './services/global-error-handler.service';
export { MetaService } from './services/meta.service';

