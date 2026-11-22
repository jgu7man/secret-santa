import { APP_DESCRIPTION, APP_NAME } from './core.constants';

/** Robots meta directives controlling search engine indexing per route. */
export enum RobotsDirective {
  INDEX_FOLLOW = 'index, follow',
  NOINDEX_NOFOLLOW = 'noindex, nofollow',
}

/** Open Graph object type identifiers. */
export enum OpenGraphType {
  WEBSITE = 'website',
}

/** Twitter Card layout identifiers. */
export enum TwitterCardType {
  SUMMARY = 'summary',
  SUMMARY_LARGE_IMAGE = 'summary_large_image',
}

/** Supported application SEO locales matching Angular i18n configurations. */
export enum SeoLocale {
  EN_US = 'en-US',
  ES_MX = 'es-MX',
}

/** Route identifiers mapped to declarative SEO presets in `app.routes.ts`. */
export enum SeoRouteKey {
  HOME = 'home',
  LOGIN = 'login',
  DASHBOARD = 'dashboard',
  EVENT_LANDING = 'event_landing',
  ADMIN_LOGIN = 'admin_login',
  ADMIN_DASHBOARD = 'admin_dashboard',
  PASSWORD_RESET = 'password_reset',
}

/** Complete SEO metadata payload applied to the document head for a view. */
export interface RouteSeoMetadata {
  readonly title: string;
  readonly description: string;
  readonly robots: RobotsDirective;
  readonly ogType: OpenGraphType;
  readonly twitterCard: TwitterCardType;
}

/** Locale-specific URL and Open Graph metadata descriptor. */
export interface SeoLocaleDescriptor {
  readonly locale: SeoLocale;
  readonly pathPrefix: string;
  readonly hreflang: string;
  readonly ogLocale: string;
  readonly shareImagePath: string;
}

/** Resolved canonical, alternate, and Open Graph image URLs for the current view. */
export interface ResolvedSeoUrls {
  readonly canonicalUrl: string;
  readonly alternateEnUrl: string;
  readonly alternateEsUrl: string;
  readonly xDefaultUrl: string;
  readonly ogImageUrl: string;
}

const LOCALE_PREFIX_PATTERN = /^\/(?:en|es)(?=\/|$)/;

/** Per-locale SEO descriptors aligned with Angular i18n and Firebase Hosting rewrites. */
export const SEO_LOCALES: Readonly<Record<SeoLocale, SeoLocaleDescriptor>> = {
  [SeoLocale.EN_US]: {
    locale: SeoLocale.EN_US,
    pathPrefix: '/en',
    hreflang: 'en',
    ogLocale: 'en_US',
    shareImagePath: 'theme/secret-santa-titulo-champana.png',
  },
  [SeoLocale.ES_MX]: {
    locale: SeoLocale.ES_MX,
    pathPrefix: '/es',
    hreflang: 'es',
    ogLocale: 'es_MX',
    shareImagePath: 'theme/santa-secreto-titulo-champana.png',
  },
};

/** Runtime type guard validating a route's configured `seoKey` data property. */
export function isSeoRouteKey(value: unknown): value is SeoRouteKey {
  return (
    typeof value === 'string' &&
    Object.values(SeoRouteKey).some((candidate) => candidate === value)
  );
}

/** Resolves an Angular `LOCALE_ID` string into a canonical `SeoLocale`. */
export function resolveLocaleFromId(localeId: string): SeoLocale {
  return /^es(?:-|$)/i.test(localeId) ? SeoLocale.ES_MX : SeoLocale.EN_US;
}

/** Resolves localized SEO metadata for a route key. */
export function resolveRouteSeoMetadata(routeKey: SeoRouteKey): RouteSeoMetadata {
  switch (routeKey) {
    case SeoRouteKey.HOME:
      return {
        title: APP_NAME,
        description: APP_DESCRIPTION,
        robots: RobotsDirective.INDEX_FOLLOW,
        ogType: OpenGraphType.WEBSITE,
        twitterCard: TwitterCardType.SUMMARY_LARGE_IMAGE,
      };
    case SeoRouteKey.EVENT_LANDING:
      return {
        title: APP_NAME,
        description: APP_DESCRIPTION,
        robots: RobotsDirective.INDEX_FOLLOW,
        ogType: OpenGraphType.WEBSITE,
        twitterCard: TwitterCardType.SUMMARY_LARGE_IMAGE,
      };
    case SeoRouteKey.LOGIN:
      return {
        title: `${$localize`:@@seoLoginTitle:Host Sign In`} - ${APP_NAME}`,
        description: APP_DESCRIPTION,
        robots: RobotsDirective.NOINDEX_NOFOLLOW,
        ogType: OpenGraphType.WEBSITE,
        twitterCard: TwitterCardType.SUMMARY,
      };
    case SeoRouteKey.DASHBOARD:
      return {
        title: `${$localize`:@@seoDashboardTitle:Host Dashboard`} - ${APP_NAME}`,
        description: APP_DESCRIPTION,
        robots: RobotsDirective.NOINDEX_NOFOLLOW,
        ogType: OpenGraphType.WEBSITE,
        twitterCard: TwitterCardType.SUMMARY,
      };
    case SeoRouteKey.ADMIN_LOGIN:
      return {
        title: `${$localize`:@@seoAdminLoginTitle:Admin Access`} - ${APP_NAME}`,
        description: APP_DESCRIPTION,
        robots: RobotsDirective.NOINDEX_NOFOLLOW,
        ogType: OpenGraphType.WEBSITE,
        twitterCard: TwitterCardType.SUMMARY,
      };
    case SeoRouteKey.ADMIN_DASHBOARD:
      return {
        title: `${$localize`:@@seoAdminDashboardTitle:Event Administration`} - ${APP_NAME}`,
        description: APP_DESCRIPTION,
        robots: RobotsDirective.NOINDEX_NOFOLLOW,
        ogType: OpenGraphType.WEBSITE,
        twitterCard: TwitterCardType.SUMMARY,
      };
    case SeoRouteKey.PASSWORD_RESET:
      return {
        title: `${$localize`:@@seoPasswordResetTitle:Reset Secret Word`} - ${APP_NAME}`,
        description: APP_DESCRIPTION,
        robots: RobotsDirective.NOINDEX_NOFOLLOW,
        ogType: OpenGraphType.WEBSITE,
        twitterCard: TwitterCardType.SUMMARY,
      };
  }
}

/** Strips query parameters and URL fragments from a router URL string. */
export function stripRouteQueryAndHash(rawUrl: string): string {
  const withoutHash = rawUrl.split('#')[0] ?? '/';
  const withoutQuery = withoutHash.split('?')[0] ?? '/';
  return withoutQuery || '/';
}

/** Normalizes any URL path into an app-relative path without locale prefix. */
export function normalizeAppPath(rawUrl: string): string {
  const clean = stripRouteQueryAndHash(rawUrl);
  const withoutLocale = clean.replace(LOCALE_PREFIX_PATTERN, '') || '/';
  return withoutLocale.startsWith('/') ? withoutLocale : `/${withoutLocale}`;
}

/** Builds an absolute localized URL matching Firebase Hosting `/en/` and `/es/` paths. */
export function buildLocalizedUrl(
  origin: string,
  pathPrefix: string,
  appPath: string
): string {
  const normalizedPath = normalizeAppPath(appPath);
  const targetPath =
    normalizedPath === '/' ? `${pathPrefix}/` : `${pathPrefix}${normalizedPath}`;
  return `${origin}${targetPath}`;
}

/** Builds canonical, alternate `hreflang`, and social share image URLs when origin is valid. */
export function buildSeoUrls(
  origin: string | undefined,
  rawUrl: string,
  activeLocale: SeoLocale
): ResolvedSeoUrls | null {
  if (!origin || origin === 'null') {
    return null;
  }

  const normalizedOrigin = origin.replace(/\/+$/, '');
  const appPath = normalizeAppPath(rawUrl);
  const enDescriptor = SEO_LOCALES[SeoLocale.EN_US];
  const esDescriptor = SEO_LOCALES[SeoLocale.ES_MX];
  const activeDescriptor = SEO_LOCALES[activeLocale];

  const alternateEnUrl = buildLocalizedUrl(
    normalizedOrigin,
    enDescriptor.pathPrefix,
    appPath
  );
  const alternateEsUrl = buildLocalizedUrl(
    normalizedOrigin,
    esDescriptor.pathPrefix,
    appPath
  );

  return {
    canonicalUrl:
      activeLocale === SeoLocale.ES_MX ? alternateEsUrl : alternateEnUrl,
    alternateEnUrl,
    alternateEsUrl,
    xDefaultUrl: alternateEnUrl,
    ogImageUrl: `${normalizedOrigin}/${activeDescriptor.shareImagePath}`,
  };
}

