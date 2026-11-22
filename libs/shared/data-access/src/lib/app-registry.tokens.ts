import {
  EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders,
} from '@angular/core';
import { AppRegistryDocument } from './app-registry.model';

/** Injection token holding per-app default `AppRegistryDocument` maps provided by the host app. */
export const APP_REGISTRY_DEFAULTS = new InjectionToken<
  Readonly<Record<string, AppRegistryDocument>>
>('APP_REGISTRY_DEFAULTS', {
  providedIn: 'root',
  factory: () => ({}),
});

/** Registers app-specific default `AppRegistryDocument` definitions at application root. */
export function provideAppRegistryDefaults(
  defaults: Readonly<Record<string, AppRegistryDocument>>
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_REGISTRY_DEFAULTS,
      useValue: defaults,
    },
  ]);
}
