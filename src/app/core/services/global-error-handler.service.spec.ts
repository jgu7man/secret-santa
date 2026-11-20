import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from './analytics.service';
import {
  ErrorCategory,
  GlobalErrorHandler,
  normalizeUnknownError,
  sanitizeErrorMessage,
} from './global-error-handler.service';

describe('GlobalErrorHandler', () => {
  it('should scrub emails and sensitive credential values from error messages', () => {
    const raw =
      'Failed for user@example.com with token=supersecret123 and password:my-password';
    const sanitized = sanitizeErrorMessage(raw);

    expect(sanitized).not.toContain('user@example.com');
    expect(sanitized).not.toContain('supersecret123');
    expect(sanitized).not.toContain('my-password');
    expect(sanitized).toContain('[redacted-email]');
    expect(sanitized).toContain('token=[redacted]');
    expect(sanitized).toContain('password:[redacted]');
  });

  it('should categorize Firebase, chunk load, runtime, and unknown errors', () => {
    const firebaseError = normalizeUnknownError({
      code: 'permission-denied',
      message: 'Missing permissions for alice@example.com',
    });
    expect(firebaseError.category).toBe(ErrorCategory.FIREBASE);
    expect(firebaseError.code).toBe('permission-denied');
    expect(firebaseError.message).toContain('[redacted-email]');

    const chunkError = normalizeUnknownError({
      rejection: new Error('Loading chunk 42 failed'),
    });
    expect(chunkError.category).toBe(ErrorCategory.CHUNK_LOAD);

    const runtimeError = normalizeUnknownError(new Error('Unexpected null'));
    expect(runtimeError.category).toBe(ErrorCategory.RUNTIME);

    const unknownError = normalizeUnknownError(404);
    expect(unknownError.category).toBe(ErrorCategory.UNKNOWN);
  });

  it('should log sanitized error and forward non-fatal exception telemetry', () => {
    const analyticsSpy = jasmine.createSpyObj<AnalyticsService>(
      'AnalyticsService',
      ['trackException']
    );
    analyticsSpy.trackException.and.resolveTo();

    const consoleSpy = spyOn(console, 'error');

    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: AnalyticsService, useValue: analyticsSpy },
      ],
    });

    const handler = TestBed.inject(GlobalErrorHandler);
    handler.handleError(new Error('Failure for test@example.com'));

    expect(consoleSpy).toHaveBeenCalled();
    expect(analyticsSpy.trackException).toHaveBeenCalledWith(
      '[runtime] Failure for [redacted-email]',
      false
    );
  });
});

