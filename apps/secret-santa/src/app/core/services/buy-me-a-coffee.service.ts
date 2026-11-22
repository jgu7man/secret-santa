import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { BuyMeACoffeeSettings } from '@secret-santa/shared-data-access';
import { BuyMeACoffeeVisibilityState } from '../config/buy-me-a-coffee.config';
import { CORE_CONFIG } from '../config/core.tokens';
import { SeoRouteKey } from '../config/seo.config';

const BMC_SCRIPT_SELECTOR = 'script[data-name="BMC-Widget"]';
const BMC_VISIBILITY_ATTR = 'data-bmc-widget';
const BMC_WBTN_ID = 'bmc-wbtn';
const BMC_IFRAME_ID = 'bmc-iframe';

/**
 * Manages the Buy Me a Coffee floating widget lifecycle across routes:
 * suppressed on the landing page (`SeoRouteKey.HOME`) where the inline button is shown,
 * and lazily loaded and displayed on all other routes.
 */
@Injectable({
  providedIn: 'root',
})
export class BuyMeACoffeeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly coreConfig = inject(CORE_CONFIG);

  private lastRouteKey: SeoRouteKey | null = null;

  /** Active Buy Me a Coffee settings (seeded from local defaults, updated from Firestore). */
  readonly settings = signal<BuyMeACoffeeSettings>({
    enabled: this.coreConfig.buyMeACoffee.enabled,
    slug: this.coreConfig.buyMeACoffee.slug,
    color: this.coreConfig.buyMeACoffee.color,
    position: this.coreConfig.buyMeACoffee.position,
    xMargin: this.coreConfig.buyMeACoffee.xMargin,
    yMargin: this.coreConfig.buyMeACoffee.yMargin,
  });

  /** Applies remotely managed settings from `apps/{appId}` and re-syncs widget visibility. */
  applyRemoteSettings(remote: BuyMeACoffeeSettings | undefined): void {
    if (!remote) {
      return;
    }

    this.settings.set(remote);

    if (!remote.enabled) {
      this.hideWidget();
      return;
    }

    if (this.lastRouteKey !== null) {
      this.syncForRoute(this.lastRouteKey);
    }
  }

  /** Synchronizes widget visibility and lazy loading for the active route key. */
  syncForRoute(routeKey: SeoRouteKey | null): void {
    this.lastRouteKey = routeKey;
    if (routeKey === SeoRouteKey.HOME) {
      this.hideWidget();
      return;
    }

    this.showWidget();
  }

  /** Shows the floating widget and injects the external widget script if needed. */
  showWidget(): void {
    if (!this.canRunWidget()) {
      return;
    }

    this.document.body?.setAttribute(
      BMC_VISIBILITY_ATTR,
      BuyMeACoffeeVisibilityState.VISIBLE
    );
    this.ensureScriptInjected();
  }

  /** Hides the floating widget and closes any open widget drawer on the landing route. */
  hideWidget(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.document.body?.setAttribute(
      BMC_VISIBILITY_ATTR,
      BuyMeACoffeeVisibilityState.HIDDEN
    );

    const iframeBackdrop =
      this.document.getElementById(BMC_IFRAME_ID)?.parentElement;
    if (iframeBackdrop && iframeBackdrop.style.width === '100%') {
      iframeBackdrop.click();
    }
  }

  private canRunWidget(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    if (!this.settings().enabled) {
      return false;
    }

    const win = this.document.defaultView;
    const isKarmaRunner = win !== null && '__karma__' in win;
    return !isKarmaRunner || this.coreConfig.buyMeACoffee.allowInTests;
  }

  private ensureScriptInjected(): void {
    const headOrBody = this.document.body ?? this.document.head;
    if (!headOrBody) {
      return;
    }

    if (this.document.querySelector(BMC_SCRIPT_SELECTOR)) {
      return;
    }

    const staticConfig = this.coreConfig.buyMeACoffee;
    const activeSettings = this.settings();
    const script = this.document.createElement('script');
    script.async = true;
    script.src = staticConfig.scriptUrl;
    script.setAttribute('fetchpriority', 'low');
    script.setAttribute('integrity', staticConfig.integrity);
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('referrerpolicy', 'no-referrer');
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('data-cfasync', 'false');
    script.setAttribute('data-id', activeSettings.slug);
    script.setAttribute('data-description', staticConfig.description);
    script.setAttribute('data-message', staticConfig.message);
    script.setAttribute('data-color', activeSettings.color);
    script.setAttribute('data-position', activeSettings.position);
    script.setAttribute('data-x_margin', String(activeSettings.xMargin));
    script.setAttribute('data-y_margin', String(activeSettings.yMargin));

    script.addEventListener('load', () => {
      const win = this.document.defaultView;
      if (
        win &&
        this.document.readyState !== 'loading' &&
        !this.document.getElementById(BMC_WBTN_ID)
      ) {
        // widget.prod.min.js initializes on window DOMContentLoaded; trigger it when lazy-loaded post-boot.
        win.dispatchEvent(new Event('DOMContentLoaded'));
      }
    });

    headOrBody.appendChild(script);
  }
}
