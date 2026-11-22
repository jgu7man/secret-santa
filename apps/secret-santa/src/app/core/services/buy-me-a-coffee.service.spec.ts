import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { buyMeACoffeeSettingsSchema } from '@secret-santa/shared-data-access';
import {
  BuyMeACoffeeVisibilityState,
  BuyMeACoffeeWidgetPosition,
  buildBuyMeACoffeeButtonConfig,
} from '../config/buy-me-a-coffee.config';
import { CORE_CONFIG, mergeCoreConfig } from '../config/core.tokens';
import { SeoLocale, SeoRouteKey } from '../config/seo.config';
import { BuyMeACoffeeService } from './buy-me-a-coffee.service';

describe('BuyMeACoffeeService', () => {
  afterEach(() => {
    const doc = TestBed.inject(DOCUMENT);
    doc.body?.removeAttribute('data-bmc-widget');
    doc
      .querySelectorAll('script[data-name="BMC-Widget"]')
      .forEach((node) => node.remove());
  });

  it('should build localized button metadata for English and Spanish landing pages', () => {
    const enButton = buildBuyMeACoffeeButtonConfig(SeoLocale.EN_US);
    const esButton = buildBuyMeACoffeeButtonConfig(SeoLocale.ES_MX);

    expect(enButton.href).toBe('https://www.buymeacoffee.com/jgu7man');
    expect(enButton.imageSrc).toContain('Buy+me+a+coffee');
    expect(enButton.width).toBe(235);
    expect(enButton.height).toBe(50);

    expect(esButton.href).toBe('https://www.buymeacoffee.com/jgu7man');
    expect(esButton.imageSrc).toContain('C%C3%B3mprame+un+caf%C3%A9');
    expect(esButton.width).toBe(262);
    expect(esButton.height).toBe(50);
  });

  it('should hide widget and skip script injection on the home landing route', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CORE_CONFIG,
          useValue: mergeCoreConfig({
            buyMeACoffee: { allowInTests: true },
          }),
        },
      ],
    });

    const service = TestBed.inject(BuyMeACoffeeService);
    const doc = TestBed.inject(DOCUMENT);

    service.syncForRoute(SeoRouteKey.HOME);

    expect(doc.body.getAttribute('data-bmc-widget')).toBe(
      BuyMeACoffeeVisibilityState.HIDDEN
    );
    expect(doc.querySelector('script[data-name="BMC-Widget"]')).toBeNull();
  });

  it('should skip external script injection inside Karma runner by default', () => {
    TestBed.configureTestingModule({});

    const service = TestBed.inject(BuyMeACoffeeService);
    const doc = TestBed.inject(DOCUMENT);

    service.syncForRoute(SeoRouteKey.DASHBOARD);

    expect(doc.querySelector('script[data-name="BMC-Widget"]')).toBeNull();
  });

  it('should inject secure low-priority BMC widget script on non-home routes and dispatch DOMContentLoaded on load', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CORE_CONFIG,
          useValue: mergeCoreConfig({
            buyMeACoffee: { allowInTests: true },
          }),
        },
      ],
    });

    const service = TestBed.inject(BuyMeACoffeeService);
    const doc = TestBed.inject(DOCUMENT);
    const win = doc.defaultView;

    let capturedScript: HTMLScriptElement | null = null;
    const originalAppendChild = doc.body.appendChild.bind(doc.body);
    spyOn(doc.body, 'appendChild').and.callFake(
      <T extends Node>(node: T): T => {
        if (
          node instanceof HTMLScriptElement &&
          node.getAttribute('data-name') === 'BMC-Widget'
        ) {
          capturedScript = node;
          return node;
        }
        return originalAppendChild(node);
      }
    );

    const domLoadedSpy = jasmine.createSpy('domLoaded');
    win?.addEventListener('DOMContentLoaded', domLoadedSpy);

    try {
      service.syncForRoute(SeoRouteKey.EVENT_LANDING);

      expect(doc.body.getAttribute('data-bmc-widget')).toBe(
        BuyMeACoffeeVisibilityState.VISIBLE
      );
      expect(capturedScript).not.toBeNull();

      const script = capturedScript as unknown as HTMLScriptElement;
      expect(script.async).toBeTrue();
      expect(script.src).toBe(
        'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js'
      );
      expect(script.getAttribute('fetchpriority')).toBe('low');
      expect(script.getAttribute('crossorigin')).toBe('anonymous');
      expect(script.getAttribute('referrerpolicy')).toBe('no-referrer');
      expect(script.getAttribute('integrity')).toMatch(/^sha384-/);
      expect(script.getAttribute('data-id')).toBe('jgu7man');
      expect(script.getAttribute('data-color')).toBe('#40DCA5');
      expect(script.getAttribute('data-position')).toBe(
        BuyMeACoffeeWidgetPosition.RIGHT
      );
      expect(script.getAttribute('data-x_margin')).toBe('18');
      expect(script.getAttribute('data-y_margin')).toBe('18');

      script.dispatchEvent(new Event('load'));
      expect(domLoadedSpy).toHaveBeenCalledTimes(1);

      service.syncForRoute(SeoRouteKey.HOME);
      expect(doc.body.getAttribute('data-bmc-widget')).toBe(
        BuyMeACoffeeVisibilityState.HIDDEN
      );
    } finally {
      win?.removeEventListener('DOMContentLoaded', domLoadedSpy);
    }
  });

  it('should apply remote BuyMeACoffee settings and hide widget when disabled remotely', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CORE_CONFIG,
          useValue: mergeCoreConfig({
            buyMeACoffee: { allowInTests: true },
          }),
        },
      ],
    });

    const service = TestBed.inject(BuyMeACoffeeService);
    const doc = TestBed.inject(DOCUMENT);

    service.applyRemoteSettings({
      enabled: false,
      slug: 'marxa_team',
      color: '#112233',
      position: BuyMeACoffeeWidgetPosition.LEFT,
      xMargin: 24,
      yMargin: 32,
    });

    expect(service.settings().slug).toBe('marxa_team');
    expect(service.settings().enabled).toBeFalse();
    expect(doc.body.getAttribute('data-bmc-widget')).toBe(
      BuyMeACoffeeVisibilityState.HIDDEN
    );
  });

  it('should reject invalid slugs or non-hex colors via buyMeACoffeeSettingsSchema', () => {
    expect(() =>
      buyMeACoffeeSettingsSchema.parse({
        enabled: true,
        slug: 'bad/slug?x=1',
        color: '#40DCA5',
        position: BuyMeACoffeeWidgetPosition.RIGHT,
        xMargin: 18,
        yMargin: 18,
      })
    ).toThrow();

    expect(() =>
      buyMeACoffeeSettingsSchema.parse({
        enabled: true,
        slug: 'jgu7man',
        color: 'green',
        position: BuyMeACoffeeWidgetPosition.RIGHT,
        xMargin: 18,
        yMargin: 18,
      })
    ).toThrow();
  });
});

