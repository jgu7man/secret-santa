import { FormControl, FormGroup } from '@angular/forms';
import { UserRole } from '@marxa/auth-domain';
import {
  AppEnvironment,
  BuyMeACoffeeWidgetPosition,
} from '@secret-santa/shared-data-access';

export interface ManagedAppOption {
  readonly id: string;
  readonly label: string;
  readonly supportsAuthRbac: boolean;
  readonly supportsOperations: boolean;
  readonly supportsBuyMeACoffee: boolean;
  readonly supportsFooter: boolean;
}

export interface CreateReleasePayload {
  readonly version: string;
  readonly environment: AppEnvironment;
  readonly notes: string;
}

export type AuthSettingsFormGroup = FormGroup<{
  brandName: FormControl<string>;
  appName: FormControl<string>;
  postLoginRedirectUrl: FormControl<string>;
  loginRoute: FormControl<string>;
  requestAccessRoute: FormControl<string>;
  inviteBasePath: FormControl<string>;
  requiresProfileCompletionByDefault: FormControl<boolean>;
  defaultTargetRole: FormControl<UserRole>;
  inviteExpirationHours: FormControl<number>;
}>;

export type OperationsSettingsFormGroup = FormGroup<{
  maintenanceMode: FormControl<boolean>;
  maintenanceMessage: FormControl<string>;
  allowGuestEventCreation: FormControl<boolean>;
  allowNewRegistrations: FormControl<boolean>;
  defaultMinAmount: FormControl<number>;
  maxParticipantsPerEvent: FormControl<number>;
  announcementEnabled: FormControl<boolean>;
  announcementText: FormControl<string>;
}>;

export type BuyMeACoffeeSettingsFormGroup = FormGroup<{
  enabled: FormControl<boolean>;
  slug: FormControl<string>;
  color: FormControl<string>;
  position: FormControl<BuyMeACoffeeWidgetPosition>;
  xMargin: FormControl<number>;
  yMargin: FormControl<number>;
}>;

export type FooterSettingsFormGroup = FormGroup<{
  brandName: FormControl<string>;
  whatsappNumber: FormControl<string>;
  whatsappDisplay: FormControl<string>;
  email: FormControl<string>;
  websiteUrl: FormControl<string>;
}>;
