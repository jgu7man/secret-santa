/**
 * Core application-wide constants and runtime safety thresholds.
 */

/** Default timeout duration for transient success/info banners in milliseconds. */
export const MESSAGE_DISPLAY_DURATION = 3000;

/** Extended timeout duration for longer feedback messages in milliseconds. */
export const LONG_MESSAGE_DISPLAY_DURATION = 5000;

/** Hostnames treated as local development environments where analytics stay disabled by default. */
export const LOCAL_HOSTNAMES: ReadonlySet<string> = new Set([
  'localhost',
  '127.0.0.1',
  '[::1]',
  '0.0.0.0',
]);

/** Prefix used in example configuration files to mark unconfigured placeholder values. */
export const CONFIG_PLACEHOLDER_PREFIX = 'YOUR_';

/** Canonical Google Analytics 4 measurement ID format. */
export const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/i;

/** Strips query parameters and URL fragments from a router URL string. */
export function stripRouteQueryAndHash(rawUrl: string): string {
  const withoutHash = rawUrl.split('#')[0] ?? '/';
  const withoutQuery = withoutHash.split('?')[0] ?? '/';
  return withoutQuery || '/';
}
