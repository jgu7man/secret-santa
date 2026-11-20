import { DOCUMENT } from '@angular/common';
import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { CORE_CONFIG } from '../config/core.tokens';
import {
  OpenGraphType,
  RobotsDirective,
  RouteSeoMetadata,
  SEO_LOCALES,
  SeoLocale,
  SeoRouteKey,
  TwitterCardType,
  buildSeoUrls,
  resolveLocaleFromId,
  resolveRouteSeoMetadata,
} from '../config/seo.config';

/**
 * Manages document title, Open Graph, Twitter Cards, robots directives,
 * canonical links, and localized `hreflang` alternates across routes.
 */
@Injectable({
  providedIn: 'root',
})
export class MetaService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly coreConfig = inject(CORE_CONFIG);
  private readonly activeLocale = resolveLocaleFromId(inject(LOCALE_ID));

  /** Applies preconfigured SEO metadata and link tags for a route key. */
  applyRouteSeo(routeKey: SeoRouteKey, currentUrl: string): void {
    const metadata = resolveRouteSeoMetadata(routeKey);
    this.applyMetadata(metadata, currentUrl);
  }

  /** Updates page title and social sharing meta tags for a public event page. */
  updateEventMeta(eventName: string): void {
    const title = `${eventName} - ${this.coreConfig.seo.appName}`;
    const description = $localize`:@@eventMetaDescription:Join the gift exchange "${eventName}:EVENT_NAME:". Register to participate in the secret santa.`;
    const currentUrl = this.document.location?.pathname ?? '/';

    this.applyMetadata(
      {
        title,
        description,
        robots: RobotsDirective.INDEX_FOLLOW,
        ogType: OpenGraphType.WEBSITE,
        twitterCard: TwitterCardType.SUMMARY_LARGE_IMAGE,
      },
      currentUrl
    );
  }

  /** Resets SEO tags back to the default application landing configuration. */
  resetToDefault(): void {
    const currentUrl = this.document.location?.pathname ?? '/';
    this.applyRouteSeo(SeoRouteKey.HOME, currentUrl);
  }

  private applyMetadata(metadata: RouteSeoMetadata, currentUrl: string): void {
    const activeDescriptor = SEO_LOCALES[this.activeLocale];
    const alternateDescriptor =
      this.activeLocale === SeoLocale.ES_MX
        ? SEO_LOCALES[SeoLocale.EN_US]
        : SEO_LOCALES[SeoLocale.ES_MX];

    if (this.document.documentElement) {
      this.document.documentElement.lang = this.activeLocale;
    }

    this.titleService.setTitle(metadata.title);

    this.metaService.updateTag({
      name: 'description',
      content: metadata.description,
    });
    this.metaService.updateTag({
      name: 'robots',
      content: metadata.robots,
    });

    this.metaService.updateTag({
      property: 'og:type',
      content: metadata.ogType,
    });
    this.metaService.updateTag({
      property: 'og:site_name',
      content: this.coreConfig.seo.appName,
    });
    this.metaService.updateTag({
      property: 'og:title',
      content: metadata.title,
    });
    this.metaService.updateTag({
      property: 'og:description',
      content: metadata.description,
    });
    this.metaService.updateTag({
      property: 'og:locale',
      content: activeDescriptor.ogLocale,
    });
    this.metaService.updateTag({
      property: 'og:locale:alternate',
      content: alternateDescriptor.ogLocale,
    });

    this.metaService.updateTag({
      name: 'twitter:card',
      content: metadata.twitterCard,
    });
    this.metaService.updateTag({
      name: 'twitter:title',
      content: metadata.title,
    });
    this.metaService.updateTag({
      name: 'twitter:description',
      content: metadata.description,
    });

    const seoUrls = buildSeoUrls(
      this.document.location?.origin,
      currentUrl,
      this.activeLocale
    );

    if (!seoUrls) {
      return;
    }

    this.metaService.updateTag({
      property: 'og:url',
      content: seoUrls.canonicalUrl,
    });
    this.metaService.updateTag({
      property: 'og:image',
      content: seoUrls.ogImageUrl,
    });
    this.metaService.updateTag({
      name: 'twitter:image',
      content: seoUrls.ogImageUrl,
    });

    this.upsertHeadLink('link[rel="canonical"]', {
      rel: 'canonical',
      href: seoUrls.canonicalUrl,
    });

    if (metadata.robots === RobotsDirective.INDEX_FOLLOW) {
      this.upsertHeadLink('link[rel="alternate"][hreflang="en"]', {
        rel: 'alternate',
        hreflang: SEO_LOCALES[SeoLocale.EN_US].hreflang,
        href: seoUrls.alternateEnUrl,
      });
      this.upsertHeadLink('link[rel="alternate"][hreflang="es"]', {
        rel: 'alternate',
        hreflang: SEO_LOCALES[SeoLocale.ES_MX].hreflang,
        href: seoUrls.alternateEsUrl,
      });
      this.upsertHeadLink('link[rel="alternate"][hreflang="x-default"]', {
        rel: 'alternate',
        hreflang: 'x-default',
        href: seoUrls.xDefaultUrl,
      });
    } else {
      this.removeHeadLinks('link[rel="alternate"][hreflang]');
    }
  }

  private upsertHeadLink(
    selector: string,
    attributes: Readonly<Record<string, string>>
  ): void {
    const head = this.document.head;
    if (!head) {
      return;
    }

    let linkElement = head.querySelector<HTMLLinkElement>(selector);
    if (!linkElement) {
      linkElement = this.document.createElement('link');
      head.appendChild(linkElement);
    }

    for (const [attribute, value] of Object.entries(attributes)) {
      linkElement.setAttribute(attribute, value);
    }
  }

  private removeHeadLinks(selector: string): void {
    const head = this.document.head;
    if (!head) {
      return;
    }
    head.querySelectorAll(selector).forEach((element) => element.remove());
  }
}

