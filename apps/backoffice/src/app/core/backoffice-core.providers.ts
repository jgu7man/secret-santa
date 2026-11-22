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
import { NavigationEnd, Router } from '@angular/router';
import { AuthRuntimeConfigService } from '@marxa/auth-engine';
import { AnalyticsService, GlobalErrorHandler } from '@secret-santa/shared-core';
import { filter } from 'rxjs';

/**
 * Registers shared error handling, runtime app config hydration, and page-view telemetry.
 */
export function provideBackofficeCore(): EnvironmentProviders {
  const providers: Array<Provider | EnvironmentProviders> = [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideAppInitializer(() => {
      const router = inject(Router);
      const analyticsService = inject(AnalyticsService);
      const authRuntimeConfig = inject(AuthRuntimeConfigService);
      const destroyRef = inject(DestroyRef);
      const document = inject(DOCUMENT);

      void analyticsService.initialize();
      void authRuntimeConfig.loadFromFirestore().catch((error) => {
        console.warn('Could not load runtime app config from Firestore:', error);
      });

      router.events
        .pipe(
          filter(
            (event): event is NavigationEnd => event instanceof NavigationEnd
          ),
          takeUntilDestroyed(destroyRef)
        )
        .subscribe((event) => {
          void analyticsService.trackPageView(
            event.urlAfterRedirects,
            document.title
          );
        });
    }),
  ];

  return makeEnvironmentProviders(providers);
}
