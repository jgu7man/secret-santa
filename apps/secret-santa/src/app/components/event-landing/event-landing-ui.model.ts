/** Active authentication/onboarding tab for guest visitors on an event landing page. */
export enum EventLandingTab {
  REGISTER = 'register',
  LOGIN = 'login',
}

/** Consolidated UI state for `EventLandingComponent`. */
export interface EventLandingUiState {
  readonly isLoading: boolean;
  readonly isSubmitting: boolean;
  readonly isGoogleLinked: boolean;
  readonly showLeaveConfirm: boolean;
  readonly errorMessage: string;
  readonly successMessage: string;
  readonly selectedTab: EventLandingTab;
}

/** Typed form payload emitted when a guest submits the event registration form. */
export interface EventGuestRegisterPayload {
  readonly name: string;
  readonly secretWord: string;
  readonly email: string;
  readonly general: string;
  readonly sizes: string;
}

/** Profile fields pre-populated from Google Sign-In during participant registration. */
export interface GooglePrefillData {
  readonly name?: string;
  readonly email?: string;
}
