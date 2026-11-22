import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { FIREBASE_APP } from '@secret-santa/shared-firebase';
import { Analytics } from 'firebase/analytics';
import { FirebaseApp } from 'firebase/app';
import { AnalyticsEventName } from '../config/analytics.config';
import { ANALYTICS_CONFIG, ANALYTICS_SDK, AnalyticsSdkAdapter } from '../config/analytics.tokens';
import {
  AnalyticsService,
  isValidMeasurementId,
  sanitizeAnalyticsPath,
} from './analytics.service';

describe('AnalyticsService', () => {
  const fakeApp = {
    name: '[DEFAULT]',
    options: { measurementId: 'G-TEST12345' },
  } as unknown as FirebaseApp;

  const fakeAnalytics = {
    app: fakeApp,
  } as unknown as Analytics;

  function createSdkSpy(): jasmine.SpyObj<AnalyticsSdkAdapter> {
    return jasmine.createSpyObj<AnalyticsSdkAdapter>('AnalyticsSdkAdapter', [
      'isSupported',
      'initializeAnalytics',
      'logEvent',
    ]);
  }

  it('should validate GA4 measurement IDs and reject placeholders', () => {
    expect(isValidMeasurementId('G-MXRM5XQ5T8')).toBeTrue();
    expect(isValidMeasurementId('YOUR_MEASUREMENT_ID')).toBeFalse();
    expect(isValidMeasurementId('')).toBeFalse();
    expect(isValidMeasurementId(undefined)).toBeFalse();
    expect(isValidMeasurementId('UA-12345-1')).toBeFalse();
  });

  it('should sanitize query strings, hashes, and participant reset tokens from paths', () => {
    expect(sanitizeAnalyticsPath('/event/ev1?invite=secret#top')).toBe(
      '/event/ev1'
    );
    expect(
      sanitizeAnalyticsPath('/event/ev1/reset/participant-secret-id?token=abc', [
        {
          pattern: /^(\/event\/[^/]+\/reset\/)[^/]+/,
          replacement: '$1:participantId',
        },
      ])
    ).toBe('/event/ev1/reset/:participantId');
    expect(sanitizeAnalyticsPath('dashboard')).toBe('/dashboard');
  });

  it('should stay disabled on localhost/test runner by default', async () => {
    const sdk = createSdkSpy();
    sdk.isSupported.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        { provide: FIREBASE_APP, useValue: fakeApp },
        { provide: ANALYTICS_SDK, useValue: sdk },
        {
          provide: ANALYTICS_CONFIG,
          useValue: {
            enabled: true,
            allowLocalhost: false,
            measurementId: 'G-TEST12345',
          },
        },
      ],
    });

    const service = TestBed.inject(AnalyticsService);
    const initialized = await service.initialize();

    expect(initialized).toBeFalse();
    expect(service.isEnabled()).toBeFalse();
    expect(sdk.initializeAnalytics).not.toHaveBeenCalled();

    await service.trackPageView('/dashboard', 'Dashboard');
    expect(sdk.logEvent).not.toHaveBeenCalled();
  });

  it('should stay disabled when measurementId is missing or a placeholder', async () => {
    const sdk = createSdkSpy();
    sdk.isSupported.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        { provide: FIREBASE_APP, useValue: fakeApp },
        { provide: ANALYTICS_SDK, useValue: sdk },
        {
          provide: ANALYTICS_CONFIG,
          useValue: {
            enabled: true,
            allowLocalhost: true,
            measurementId: 'YOUR_MEASUREMENT_ID',
          },
        },
      ],
    });

    const service = TestBed.inject(AnalyticsService);
    const initialized = await service.initialize();

    expect(initialized).toBeFalse();
    expect(sdk.initializeAnalytics).not.toHaveBeenCalled();
  });

  it('should initialize and track deduplicated page views and domain events when enabled', async () => {
    const sdk = createSdkSpy();
    sdk.isSupported.and.resolveTo(true);
    sdk.initializeAnalytics.and.returnValue(fakeAnalytics);

    TestBed.configureTestingModule({
      providers: [
        { provide: FIREBASE_APP, useValue: fakeApp },
        { provide: ANALYTICS_SDK, useValue: sdk },
        {
          provide: ANALYTICS_CONFIG,
          useValue: {
            enabled: true,
            allowLocalhost: true,
            measurementId: 'G-TEST12345',
          },
        },
      ],
    });

    const service = TestBed.inject(AnalyticsService);
    const documentRef = TestBed.inject(DOCUMENT);
    const initialized = await service.initialize();

    expect(initialized).toBeTrue();
    expect(service.isEnabled()).toBeTrue();
    expect(sdk.initializeAnalytics).toHaveBeenCalledWith(fakeApp, {
      config: { send_page_view: false },
    });

    await service.trackPageView('/event/evt-1?token=123', 'Party - Secret Santa');
    await service.trackPageView('/event/evt-1?other=456', 'Party - Secret Santa');

    expect(sdk.logEvent).toHaveBeenCalledTimes(1);
    expect(sdk.logEvent).toHaveBeenCalledWith(
      fakeAnalytics,
      AnalyticsEventName.PAGE_VIEW,
      {
        page_title: 'Party - Secret Santa',
        page_path: '/event/evt-1',
        page_location: `${documentRef.location.origin}/event/evt-1`,
      }
    );

    await service.trackEvent(AnalyticsEventName.RAFFLE_DRAWN, {
      participant_count: 6,
    });
    expect(sdk.logEvent).toHaveBeenCalledWith(
      fakeAnalytics,
      AnalyticsEventName.RAFFLE_DRAWN,
      { participant_count: 6 }
    );
  });

  it('should fail safely when browser analytics is unsupported or SDK throws', async () => {
    const sdk = createSdkSpy();
    sdk.isSupported.and.resolveTo(false);

    TestBed.configureTestingModule({
      providers: [
        { provide: FIREBASE_APP, useValue: fakeApp },
        { provide: ANALYTICS_SDK, useValue: sdk },
        {
          provide: ANALYTICS_CONFIG,
          useValue: {
            enabled: true,
            allowLocalhost: true,
            measurementId: 'G-TEST12345',
          },
        },
      ],
    });

    const service = TestBed.inject(AnalyticsService);
    const initialized = await service.initialize();

    expect(initialized).toBeFalse();
    await expectAsync(
      service.trackEvent(AnalyticsEventName.EVENT_CREATED, { is_guest: false })
    ).toBeResolved();
    expect(sdk.logEvent).not.toHaveBeenCalled();
  });
});
