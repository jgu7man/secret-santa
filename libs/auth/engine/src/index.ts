export {
  AccessRequestSource,
  AccessRequestStatus,
  AdminInviteStatus,
  AuthSessionStatus,
  UserRole,
  UserStatus,
  appUserSchema,
  isAccessRequestSource,
  isAccessRequestStatus,
  isAdminInviteStatus,
  isUserRole,
  isUserStatus,
} from '@marxa/auth-domain';
export type {
  AcceptInviteProfileInput,
  AccessRequest,
  AdminInvite,
  AppAuthSettings,
  AppUser,
  AuthUserSnapshot,
  CreatedInviteResult,
  EmailAccessRequestPayload,
  MxdUser,
  UpdateUserAdminInput,
} from '@marxa/auth-domain';
export {
  AUTH_ENGINE_CONFIG,
  createDefaultAuthEngineConfig,
  provideAuthEngine,
} from './lib/config/auth-engine.tokens';
export type { AuthEngineConfig } from './lib/config/auth-engine.tokens';
export { authAdminGuard } from './lib/guards/auth-admin.guard';
export { authGuestGuard } from './lib/guards/auth-guest.guard';
export { AuthService } from './lib/services/auth.service';
export { UserProfileService } from './lib/services/user-profile.service';
export { AuthSessionService } from './lib/services/auth-session.service';
export { AuthRuntimeConfigService } from './lib/services/auth-runtime-config.service';
export {
  AccessOnboardingService,
  isInviteActive,
} from './lib/services/access-onboarding.service';
