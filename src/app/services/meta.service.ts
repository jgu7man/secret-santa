import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { APP_DESCRIPTION, APP_NAME } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class MetaService {
  constructor(private titleService: Title, private metaService: Meta) {}

  /**
   * Updates the page title and meta tags for an event page
   */
  updateEventMeta(eventName: string): void {
    const title = `${eventName} - ${APP_NAME}`;
    const description = $localize`:@@eventMetaDescription:Join the gift exchange "${eventName}:EVENT_NAME:". Register to participate in the secret santa.`;

    // Update title
    this.titleService.setTitle(title);

    // Update or create meta tags
    this.metaService.updateTag({
      name: 'description',
      content: description,
    });

    // Open Graph meta tags for social sharing
    this.metaService.updateTag({
      property: 'og:title',
      content: title,
    });

    this.metaService.updateTag({
      property: 'og:description',
      content: description,
    });

    this.metaService.updateTag({
      property: 'og:type',
      content: 'website',
    });

    // Twitter Card meta tags
    this.metaService.updateTag({
      name: 'twitter:card',
      content: 'summary',
    });

    this.metaService.updateTag({
      name: 'twitter:title',
      content: title,
    });

    this.metaService.updateTag({
      name: 'twitter:description',
      content: description,
    });
  }

  /**
   * Resets meta tags to default app values
   */
  resetToDefault(): void {
    this.titleService.setTitle(APP_NAME);

    this.metaService.updateTag({
      name: 'description',
      content: APP_DESCRIPTION,
    });

    this.metaService.updateTag({
      property: 'og:title',
      content: APP_NAME,
    });

    this.metaService.updateTag({
      property: 'og:description',
      content: APP_DESCRIPTION,
    });

    this.metaService.updateTag({
      name: 'twitter:title',
      content: APP_NAME,
    });

    this.metaService.updateTag({
      name: 'twitter:description',
      content: APP_DESCRIPTION,
    });
  }
}
