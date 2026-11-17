/**
 * Supported application locales matching Angular i18n configurations.
 */
export enum AppLocale {
  EN_US = 'en-US',
  ES_MX = 'es-MX',
}

const LOCALE_PREFIX_PATTERN = /^\/(?:en|es)(?=\/|$)/;

/**
 * Builds the same-origin URL for switching between `/en/` and `/es/` subpaths.
 * Keeping both locales on the same origin preserves Firebase Auth session and storage.
 */
export function resolveTargetLocaleUrl(
  location: Pick<Location, 'origin' | 'pathname' | 'search' | 'hash'>,
  targetLocale: AppLocale
): string {
  const normalizedPath = location.pathname.replace(LOCALE_PREFIX_PATTERN, '') || '/';
  const localePrefix = targetLocale === AppLocale.ES_MX ? '/es' : '/en';
  const targetPath =
    normalizedPath === '/' ? `${localePrefix}/` : `${localePrefix}${normalizedPath}`;

  return `${location.origin}${targetPath}${location.search}${location.hash}`;
}
