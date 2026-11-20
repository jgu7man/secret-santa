import { ErrorHandler, Injectable, inject } from '@angular/core';
import { AnalyticsService } from './analytics.service';

/** Categorization of unhandled client-side application errors. */
export enum ErrorCategory {
  CHUNK_LOAD = 'chunk_load',
  FIREBASE = 'firebase',
  RUNTIME = 'runtime',
  UNKNOWN = 'unknown',
}

/** Structured, PII-scrubbed summary of an unhandled application error. */
export interface NormalizedAppError {
  readonly category: ErrorCategory;
  readonly message: string;
  readonly code?: string;
}

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const SENSITIVE_PARAM_PATTERN =
  /(\b(?:token|secret|password|secretWord|apiKey|key)\s*[=:]\s*)[^\s&"']+/gi;
const MAX_ERROR_MESSAGE_LENGTH = 160;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Removes emails and credential-like parameters from error descriptions. */
export function sanitizeErrorMessage(rawMessage: string): string {
  return rawMessage
    .replace(EMAIL_PATTERN, '[redacted-email]')
    .replace(SENSITIVE_PARAM_PATTERN, '$1[redacted]')
    .trim()
    .slice(0, MAX_ERROR_MESSAGE_LENGTH);
}

/** Normalizes arbitrary thrown values into a bounded, typed error summary. */
export function normalizeUnknownError(error: unknown): NormalizedAppError {
  const unwrapped =
    isPlainObject(error) && 'rejection' in error && error['rejection'] !== undefined
      ? error['rejection']
      : error;

  if (isPlainObject(unwrapped) && typeof unwrapped['code'] === 'string') {
    const code = unwrapped['code'];
    const rawMsg =
      typeof unwrapped['message'] === 'string' ? unwrapped['message'] : code;
    return {
      category: ErrorCategory.FIREBASE,
      code,
      message: sanitizeErrorMessage(rawMsg) || code,
    };
  }

  if (unwrapped instanceof Error) {
    const sanitized = sanitizeErrorMessage(unwrapped.message || unwrapped.name);
    const isChunkError =
      /ChunkLoadError|Loading chunk .* failed|Failed to fetch dynamically imported module/i.test(
        unwrapped.message
      );
    return {
      category: isChunkError ? ErrorCategory.CHUNK_LOAD : ErrorCategory.RUNTIME,
      message: sanitized || unwrapped.name,
    };
  }

  if (typeof unwrapped === 'string') {
    return {
      category: ErrorCategory.RUNTIME,
      message: sanitizeErrorMessage(unwrapped) || 'Unexpected error',
    };
  }

  return {
    category: ErrorCategory.UNKNOWN,
    message: 'Unknown application error',
  };
}

/**
 * Global Angular `ErrorHandler` that sanitizes unhandled errors before logging
 * and reporting non-fatal exception telemetry to `AnalyticsService`.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly analyticsService = inject(AnalyticsService);

  /** Handles any uncaught error from Angular change detection or async tasks. */
  handleError(error: unknown): void {
    try {
      const normalized = normalizeUnknownError(error);
      const codePrefix = normalized.code ? ` (${normalized.code})` : '';
      const formattedMessage = `[${normalized.category}]${codePrefix} ${normalized.message}`;

      console.error(formattedMessage);
      void this.analyticsService.trackException(formattedMessage, false);
    } catch {
      // Guard against recursive failures inside the global error handler.
    }
  }
}

