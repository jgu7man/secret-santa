import { DOCUMENT } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { RobotsDirective, SeoRouteKey } from '../config/seo.config';
import { MetaService } from './meta.service';

describe('MetaService', () => {
  function cleanupHeadLinks(doc: Document): void {
    doc.head
      ?.querySelectorAll('link[rel="canonical"], link[rel="alternate"]')
      .forEach((node) => node.remove());
  }

  afterEach(() => {
    const doc = TestBed.inject(DOCUMENT);
    cleanupHeadLinks(doc);
  });

  it('should apply indexable SEO tags, canonical, and hreflang links for English home route', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: LOCALE_ID, useValue: 'en-US' }],
    });

    const service = TestBed.inject(MetaService);
    const title = TestBed.inject(Title);
    const meta = TestBed.inject(Meta);
    const doc = TestBed.inject(DOCUMENT);
    const origin = doc.location.origin;

    service.applyRouteSeo(SeoRouteKey.HOME, '/');

    expect(doc.documentElement.lang).toBe('en-US');
    expect(title.getTitle()).toBe('Secret Santa');
    expect(meta.getTag('name="robots"')?.content).toBe(
      RobotsDirective.INDEX_FOLLOW
    );
    expect(meta.getTag('property="og:locale"')?.content).toBe('en_US');
    expect(meta.getTag('property="og:url"')?.content).toBe(`${origin}/en/`);
    expect(meta.getTag('property="og:image"')?.content).toBe(
      `${origin}/theme/secret-santa-titulo-champana.png`
    );

    const canonical = doc.head.querySelector('link[rel="canonical"]');
    const enAlt = doc.head.querySelector('link[rel="alternate"][hreflang="en"]');
    const esAlt = doc.head.querySelector('link[rel="alternate"][hreflang="es"]');
    const xDefault = doc.head.querySelector(
      'link[rel="alternate"][hreflang="x-default"]'
    );

    expect(canonical?.getAttribute('href')).toBe(`${origin}/en/`);
    expect(enAlt?.getAttribute('href')).toBe(`${origin}/en/`);
    expect(esAlt?.getAttribute('href')).toBe(`${origin}/es/`);
    expect(xDefault?.getAttribute('href')).toBe(`${origin}/en/`);
  });

  it('should set noindex and remove hreflang links for private routes', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: LOCALE_ID, useValue: 'en-US' }],
    });

    const service = TestBed.inject(MetaService);
    const meta = TestBed.inject(Meta);
    const doc = TestBed.inject(DOCUMENT);

    service.applyRouteSeo(SeoRouteKey.HOME, '/');
    expect(
      doc.head.querySelectorAll('link[rel="alternate"][hreflang]').length
    ).toBe(3);

    service.applyRouteSeo(SeoRouteKey.DASHBOARD, '/dashboard');
    expect(meta.getTag('name="robots"')?.content).toBe(
      RobotsDirective.NOINDEX_NOFOLLOW
    );
    expect(
      doc.head.querySelectorAll('link[rel="alternate"][hreflang]').length
    ).toBe(0);
  });

  it('should localize canonical URL and og:image when LOCALE_ID is es-MX', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: LOCALE_ID, useValue: 'es-MX' }],
    });

    const service = TestBed.inject(MetaService);
    const meta = TestBed.inject(Meta);
    const doc = TestBed.inject(DOCUMENT);
    const origin = doc.location.origin;

    service.applyRouteSeo(SeoRouteKey.EVENT_LANDING, '/event/abc123');

    expect(doc.documentElement.lang).toBe('es-MX');
    expect(meta.getTag('property="og:locale"')?.content).toBe('es_MX');
    expect(meta.getTag('property="og:locale:alternate"')?.content).toBe('en_US');
    expect(meta.getTag('property="og:url"')?.content).toBe(
      `${origin}/es/event/abc123`
    );
    expect(meta.getTag('property="og:image"')?.content).toBe(
      `${origin}/theme/santa-secreto-titulo-champana.png`
    );
  });

  it('should update event meta without duplicating head link tags', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: LOCALE_ID, useValue: 'en-US' }],
    });

    const service = TestBed.inject(MetaService);
    const title = TestBed.inject(Title);
    const meta = TestBed.inject(Meta);
    const doc = TestBed.inject(DOCUMENT);

    service.updateEventMeta('Family Swap');
    service.updateEventMeta('Office Swap');

    expect(title.getTitle()).toBe('Office Swap - Secret Santa');
    expect(meta.getTag('property="og:title"')?.content).toBe(
      'Office Swap - Secret Santa'
    );
    expect(doc.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
  });
});

