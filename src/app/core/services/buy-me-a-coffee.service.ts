import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
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

  /** Synchronizes widget visibility and lazy loading for the active route key. */
  syncForRoute(routeKey: SeoRouteKey | null): void {
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

    const iframeBackdrop = this.document.getElementById(BMC_IFRAME_ID)?.parentElement;
    if (iframeBackdrop && iframeBackdrop.style.width === '100%') {
      iframeBackdrop.click();
    }
  }

  private canRunWidget(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const config = this.coreConfig.buyMeACoffee;
    if (!config.enabled) {
      return false;
    }

    const win = this.document.defaultView;
    const isKarmaRunner = win !== null && '__karma__' in win;
    return !isKarmaRunner || config.allowInTests;
  }

  private ensureScriptInjected(): void {
    const headOrBody = this.document.body ?? this.document.head;
    if (!headOrBody) {
      return;
    }

    if (this.document.querySelector(BMC_SCRIPT_SELECTOR)) {
      return;
    }

    const config = this.coreConfig.buyMeACoffee;
    const script = this.document.createElement('script');
    script.async = true;
    script.src = config.scriptUrl;
    script.setAttribute('fetchpriority', 'low');
    script.setAttribute('integrity', config.integrity);
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('referrerpolicy', 'no-referrer');
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('data-cfasync', 'false');
    script.setAttribute('data-id', config.slug);
    script.setAttribute('data-description', config.description);
    script.setAttribute('data-message', config.message);
    script.setAttribute('data-color', config.color);
    script.setAttribute('data-position', config.position);
    script.setAttribute('data-x_margin', String(config.xMargin));
    script.setAttribute('data-y_margin', String(config.yMargin));

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

