import { SEO_LOCALES, SeoLocale } from '../core/config/seo.config';

const LOCALE_PREFIX_PATTERN = /^\/(?:en|es)(?=\/|$)/;

/**
 * Builds the same-origin URL for switching between `/en/` and `/es/` subpaths.
 * Keeping both locales on the same origin preserves Firebase Auth session and storage.
 */
export function resolveTargetLocaleUrl(
  location: Pick<Location, 'origin' | 'pathname' | 'search' | 'hash'>,
  targetLocale: SeoLocale
): string {
  const normalizedPath =
    location.pathname.replace(LOCALE_PREFIX_PATTERN, '') || '/';
  const localePrefix = SEO_LOCALES[targetLocale].pathPrefix;
  const targetPath =
    normalizedPath === '/'
      ? `${localePrefix}/`
      : `${localePrefix}${normalizedPath}`;

  return `${location.origin}${targetPath}${location.search}${location.hash}`;
}
