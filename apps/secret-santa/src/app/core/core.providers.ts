import { DOCUMENT } from '@angular/common';
import {
  DestroyRef,
  EnvironmentProviders,
  ErrorHandler,
  Provider,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import {
  ANALYTICS_CONFIG,
  AnalyticsService,
  GlobalErrorHandler,
} from '@secret-santa/shared-core';
import { AppRegistryService } from '@secret-santa/shared-data-access';
import { filter } from 'rxjs';
import {
  CORE_CONFIG,
  PartialCoreConfig,
  mergeCoreConfig,
} from './config/core.tokens';
import { isSeoRouteKey } from './config/seo.config';
import { BuyMeACoffeeService } from './services/buy-me-a-coffee.service';
import { FooterConfigService } from './services/footer-config.service';
import { MetaService } from './services/meta.service';

function getDeepestRouteSnapshot(
  root: ActivatedRouteSnapshot
): ActivatedRouteSnapshot {
  let current = root;
  while (current.firstChild) {
    current = current.firstChild;
  }
  return current;
}

/**
 * Registers application-wide core infrastructure: centralized config,
 * global error handling, SEO metadata synchronization, and Google Analytics routing telemetry.
 */
export function provideCore(
  overrides?: PartialCoreConfig
): EnvironmentProviders {
  const providers: Array<Provider | EnvironmentProviders> = [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    {
      provide: ANALYTICS_CONFIG,
      useFactory: () => inject(CORE_CONFIG).analytics,
    },
    provideAppInitializer(() => {
      const router = inject(Router);
      const metaService = inject(MetaService);
      const analyticsService = inject(AnalyticsService);
      const buyMeACoffeeService = inject(BuyMeACoffeeService);
      const footerConfigService = inject(FooterConfigService);
      const appRegistryService = inject(AppRegistryService);
      const errorHandler = inject(ErrorHandler);
      const destroyRef = inject(DestroyRef);
      const document = inject(DOCUMENT);

      metaService.resetToDefault();
      void analyticsService.initialize();
      void appRegistryService
        .getApp('secret-santa')
        .then((appDoc) => {
          buyMeACoffeeService.applyRemoteSettings(appDoc.buyMeACoffee);
          footerConfigService.applyRemoteSettings(appDoc.footer);
        })
        .catch((error: unknown) => {
          errorHandler.handleError(error);
        });

      router.events
        .pipe(
          filter(
            (event): event is NavigationEnd => event instanceof NavigationEnd
          ),
          takeUntilDestroyed(destroyRef)
        )
        .subscribe((event) => {
          const activeSnapshot = getDeepestRouteSnapshot(
            router.routerState.snapshot.root
          );
          const rawSeoKey = activeSnapshot.data['seoKey'];
          const resolvedSeoKey = isSeoRouteKey(rawSeoKey) ? rawSeoKey : null;

          if (resolvedSeoKey) {
            metaService.applyRouteSeo(resolvedSeoKey, event.urlAfterRedirects);
          } else {
            metaService.resetToDefault();
          }

          buyMeACoffeeService.syncForRoute(resolvedSeoKey);

          void analyticsService.trackPageView(
            event.urlAfterRedirects,
            document.title
          );
        });
    }),
  ];

  if (overrides) {
    providers.unshift({
      provide: CORE_CONFIG,
      useFactory: () => mergeCoreConfig(overrides),
    });
  }

  return makeEnvironmentProviders(providers);
}
