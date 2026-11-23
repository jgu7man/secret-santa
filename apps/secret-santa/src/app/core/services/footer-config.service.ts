import { Injectable, signal } from '@angular/core';
import {
  DEFAULT_FOOTER_SETTINGS,
  FooterSettings,
} from '@secret-santa/shared-data-access';

/**
 * Holds reactive footer branding and contact settings hydrated from `apps/{appId}`.
 */
@Injectable({
  providedIn: 'root',
})
export class FooterConfigService {
  readonly settings = signal<FooterSettings>(DEFAULT_FOOTER_SETTINGS);

  applyRemoteSettings(remote: FooterSettings | undefined): void {
    if (!remote) {
      return;
    }
    this.settings.set(remote);
  }
}
