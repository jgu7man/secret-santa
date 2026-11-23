export {
  AppEnvironment,
  BuyMeACoffeeWidgetPosition,
  DEFAULT_BUY_ME_A_COFFEE_SETTINGS,
  DEFAULT_FOOTER_SETTINGS,
  appRegistryDocumentSchema,
  appReleaseSchema,
  buyMeACoffeeSettingsSchema,
  createDefaultAppRegistryDocument,
  footerSettingsSchema,
  formatFooterWebsiteLabel,
  formatFooterWhatsappLabel,
  isAppEnvironment,
} from './lib/app-registry.model';
export type {
  AppRegistryDocument,
  AppRegistryUpdateInput,
  AppRelease,
  BuyMeACoffeeSettings,
  FooterSettings,
} from './lib/app-registry.model';
export { AppRegistryService } from './lib/app-registry.service';
export {
  APP_REGISTRY_DEFAULTS,
  provideAppRegistryDefaults,
} from './lib/app-registry.tokens';
