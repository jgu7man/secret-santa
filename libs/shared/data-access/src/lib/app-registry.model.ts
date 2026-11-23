import {
  AppAuthSettings,
  UserRole,
  appAuthSettingsSchema,
  firestoreTimestampSchema,
} from '@marxa/auth-domain';
import * as z from 'zod/mini';

/** Target deployment environment for an application release record. */
export enum AppEnvironment {
  DEV = 'DEV',
  BETA = 'BETA',
  PROD = 'PROD',
}

/** Supported horizontal placement options for the Buy Me a Coffee floating widget. */
export enum BuyMeACoffeeWidgetPosition {
  LEFT = 'Left',
  RIGHT = 'Right',
}

/** Runtime type guard for `AppEnvironment`. */
export function isAppEnvironment(value: unknown): value is AppEnvironment {
  return (
    typeof value === 'string' &&
    Object.values(AppEnvironment).some((candidate) => candidate === value)
  );
}

const nonEmptyString = z.string().check(z.minLength(1));
const BMC_SLUG_PATTERN = /^[a-zA-Z0-9._-]{1,64}$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const OPTIONAL_DIGITS_PATTERN = /^(?:[0-9]{7,15})?$/;
const OPTIONAL_EMAIL_PATTERN = /^(?:[^\s@]+@[^\s@]+\.[^\s@]+)?$/;
const OPTIONAL_HTTP_URL_PATTERN = /^(?:https?:\/\/[^\s/$.?#].[^\s]*)?$/i;

/** Canonical Zod Mini schema for remotely managed footer branding & contact links. */
export const footerSettingsSchema = z.object({
  brandName: nonEmptyString,
  whatsappNumber: z.string().check(z.regex(OPTIONAL_DIGITS_PATTERN)),
  whatsappDisplay: z.string().check(z.maxLength(30)),
  email: z.string().check(z.regex(OPTIONAL_EMAIL_PATTERN)),
  websiteUrl: z.string().check(z.regex(OPTIONAL_HTTP_URL_PATTERN)),
});

/** Remotely managed footer branding & contact configuration stored inside `apps/{appId}`. */
export type FooterSettings = z.infer<typeof footerSettingsSchema>;

/** Default footer contact settings used when an app document does not specify overrides. */
export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  brandName: 'Marxa Digital',
  whatsappNumber: '523121805955',
  whatsappDisplay: '',
  email: 'jgu7man@gmail.com',
  websiteUrl: 'https://marxadigital.com',
};

/**
 * Resolves the visible label for the WhatsApp contact pill.
 * Uses `whatsappDisplay` when provided (allowing masks like "Mi WhatsApp"),
 * otherwise deduces a readable local number from `whatsappNumber`.
 */
export function formatFooterWhatsappLabel(
  whatsappNumber: string,
  whatsappDisplay?: string
): string {
  const customLabel = whatsappDisplay?.trim();
  if (customLabel) {
    return customLabel;
  }

  const digits = whatsappNumber.trim();
  if (digits.length === 12 && digits.startsWith('52')) {
    return digits.slice(2);
  }
  return digits;
}

/** Derives a clean display hostname/path from a validated HTTP(S) website URL. */
export function formatFooterWebsiteLabel(websiteUrl: string): string {
  return websiteUrl.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

/** Canonical Zod Mini schema for remotely managed Buy Me a Coffee widget/button settings. */
export const buyMeACoffeeSettingsSchema = z.object({
  enabled: z.boolean(),
  slug: z.string().check(z.regex(BMC_SLUG_PATTERN)),
  color: z.string().check(z.regex(HEX_COLOR_PATTERN)),
  position: z.enum(BuyMeACoffeeWidgetPosition),
  xMargin: z.number().check(z.minimum(0), z.maximum(120)),
  yMargin: z.number().check(z.minimum(0), z.maximum(120)),
});

/** Remotely managed Buy Me a Coffee configuration stored inside `apps/{appId}`. */
export type BuyMeACoffeeSettings = z.infer<typeof buyMeACoffeeSettingsSchema>;

/** Default Buy Me a Coffee settings used when an app document does not specify overrides. */
export const DEFAULT_BUY_ME_A_COFFEE_SETTINGS: BuyMeACoffeeSettings = {
  enabled: false,
  slug: 'jgu7man',
  color: '#40DCA5',
  position: BuyMeACoffeeWidgetPosition.RIGHT,
  xMargin: 18,
  yMargin: 18,
};

/** Canonical Zod Mini schema for Firestore `apps/{appId}` documents. */
export const appRegistryDocumentSchema = z.object({
  id: nonEmptyString,
  name: nonEmptyString,
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string(),
  allowGuestEventCreation: z.boolean(),
  allowNewRegistrations: z.boolean(),
  defaultMinAmount: z.number().check(z.minimum(0)),
  maxParticipantsPerEvent: z.number().check(z.minimum(2), z.maximum(1000)),
  announcementEnabled: z.boolean(),
  announcementText: z.string(),
  auth: appAuthSettingsSchema,
  buyMeACoffee: z.optional(buyMeACoffeeSettingsSchema),
  footer: z.optional(footerSettingsSchema),
  updatedAt: z.optional(firestoreTimestampSchema),
  updatedBy: z.optional(nonEmptyString),
});

/** Canonical Firestore document stored at `apps/{appId}`, inferred from `appRegistryDocumentSchema`. */
export type AppRegistryDocument = z.infer<typeof appRegistryDocumentSchema>;

/** Mutable payload written when saving `apps/{appId}` from Backoffice. */
export type AppRegistryUpdateInput = Omit<
  AppRegistryDocument,
  'id' | 'updatedAt' | 'updatedBy'
>;

/** Canonical Zod Mini schema for Firestore `apps/{appId}/releases/{releaseId}` documents. */
export const appReleaseSchema = z.object({
  id: nonEmptyString,
  version: nonEmptyString,
  environment: z.enum(AppEnvironment),
  notes: z.string(),
  createdAt: firestoreTimestampSchema,
  createdBy: nonEmptyString,
});

/** Release entry stored under `apps/{appId}/releases/{releaseId}`, inferred from `appReleaseSchema`. */
export type AppRelease = z.infer<typeof appReleaseSchema>;

/** Builds an agnostic base `AppRegistryDocument` for any app ID, optionally merged with overrides. */
export function createDefaultAppRegistryDocument(
  appId: string,
  overrides?: Partial<Omit<AppRegistryDocument, 'id' | 'auth'>> & {
    readonly auth?: Partial<AppAuthSettings>;
  }
): AppRegistryDocument {
  const baseAuth: AppAuthSettings = {
    brandName: 'Marxa Digital',
    appName: appId,
    postLoginRedirectUrl: '/',
    loginRoute: '/login',
    requestAccessRoute: '/request-access',
    inviteBasePath: '/invite',
    requiresProfileCompletionByDefault: false,
    defaultTargetRole: UserRole.ADMIN,
    inviteExpirationHours: 72,
    allowedAdminRoles: [UserRole.ADMIN],
  };

  return {
    id: appId,
    name: appId,
    maintenanceMode: false,
    maintenanceMessage: '',
    allowGuestEventCreation: true,
    allowNewRegistrations: true,
    defaultMinAmount: 100,
    maxParticipantsPerEvent: 100,
    announcementEnabled: false,
    announcementText: '',
    ...overrides,
    auth: {
      ...baseAuth,
      ...overrides?.auth,
    },
  };
}
