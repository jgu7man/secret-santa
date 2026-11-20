import { DOCUMENT } from '@angular/common';
import { Component, ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { Analytics } from 'firebase/analytics';
import { FirebaseApp } from 'firebase/app';
import {
  ANALYTICS_SDK,
  AnalyticsSdkAdapter,
  FIREBASE_APP,
} from './config/core.tokens';
import { AnalyticsEventName } from './config/analytics.config';
import { RobotsDirective, SeoRouteKey } from './config/seo.config';
import { provideCore } from './core.providers';
import { BuyMeACoffeeService } from './services/buy-me-a-coffee.service';
import { GlobalErrorHandler } from './services/global-error-handler.service';

@Component({
  standalone: true,
  template: '<p>Dummy</p>',
})
class DummyRouteComponent {}

describe('provideCore', () => {
  const fakeApp = {
    name: '[DEFAULT]',
    options: { measurementId: 'G-TEST12345' },
  } as unknown as FirebaseApp;

  const fakeAnalytics = {
    app: fakeApp,
  } as unknown as Analytics;

  afterEach(() => {
    const doc = TestBed.inject(DOCUMENT);
    doc.head
      ?.querySelectorAll('link[rel="canonical"], link[rel="alternate"]')
      .forEach((node) => node.remove());
  });

  it('should register GlobalErrorHandler and sync SEO + Analytics on route changes', async () => {
    const sdkSpy = jasmine.createSpyObj<AnalyticsSdkAdapter>(
      'AnalyticsSdkAdapter',
      ['isSupported', 'initializeAnalytics', 'logEvent']
    );
    sdkSpy.isSupported.and.resolveTo(true);
    sdkSpy.initializeAnalytics.and.returnValue(fakeAnalytics);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            data: { seoKey: SeoRouteKey.HOME },
            component: DummyRouteComponent,
          },
          {
            path: 'dashboard',
            data: { seoKey: SeoRouteKey.DASHBOARD },
            component: DummyRouteComponent,
          },
        ]),
        { provide: FIREBASE_APP, useValue: fakeApp },
        { provide: ANALYTICS_SDK, useValue: sdkSpy },
        provideCore({
          analytics: {
            enabled: true,
            allowLocalhost: true,
            measurementId: 'G-TEST12345',
          },
        }),
      ],
    });

    const errorHandler = TestBed.inject(ErrorHandler);
    expect(errorHandler instanceof GlobalErrorHandler).toBeTrue();

    const router = TestBed.inject(Router);
    const meta = TestBed.inject(Meta);
    const bmcService = TestBed.inject(BuyMeACoffeeService);
    const bmcSpy = spyOn(bmcService, 'syncForRoute').and.callThrough();

    await router.navigateByUrl('/dashboard');

    expect(meta.getTag('name="robots"')?.content).toBe(
      RobotsDirective.NOINDEX_NOFOLLOW
    );
    expect(bmcSpy).toHaveBeenCalledWith(SeoRouteKey.DASHBOARD);
    // Wait for async initializeAnalytics + trackPageView microtasks
    await Promise.resolve();
    await Promise.resolve();

    expect(sdkSpy.logEvent).toHaveBeenCalledWith(
      fakeAnalytics,
      AnalyticsEventName.PAGE_VIEW,
      jasmine.objectContaining({
        page_path: '/dashboard',
        page_title: 'Host Dashboard - Secret Santa',
      })
    );
  });
});
