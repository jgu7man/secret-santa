import { TestBed } from '@angular/core/testing';
import {
  AccessRequestSource,
  AccessRequestStatus,
  AdminInvite,
  AdminInviteStatus,
  UserRole,
  accessRequestSchema,
  adminInviteSchema,
} from '@marxa/auth-domain';
import { FIRESTORE_DB } from '@secret-santa/shared-firebase';
import { initializeApp } from 'firebase/app';
import { Timestamp, getFirestore } from 'firebase/firestore';
import {
  AccessOnboardingService,
  isInviteActive,
} from './access-onboarding.service';
import { AuthService } from './auth.service';

describe('access-onboarding domain rules & service', () => {
  const nowMs = 1_700_000_000_000;

  function makeInvite(overrides?: Partial<AdminInvite>): AdminInvite {
    return {
      id: 'inv-1',
      email: 'user@example.com',
      targetRole: UserRole.ADMIN,
      status: AdminInviteStatus.PENDING,
      requiresProfileCompletion: false,
      createdAt: Timestamp.fromMillis(nowMs - 10_000),
      expiresAt: Timestamp.fromMillis(nowMs + 60_000),
      createdBy: 'admin@example.com',
      ...overrides,
    };
  }

  it('should consider an invitation available for redemption while it is pending and within its validity window', () => {
    expect(isInviteActive(makeInvite(), nowMs)).toBeTrue();
  });

  it('should treat an invitation as unavailable once its expiration deadline has passed', () => {
    const expired = makeInvite({
      expiresAt: Timestamp.fromMillis(nowMs - 1),
    });
    expect(isInviteActive(expired, nowMs)).toBeFalse();
  });

  it('should prevent reusing an invitation that was already accepted or revoked by an admin', () => {
    expect(
      isInviteActive(makeInvite({ status: AdminInviteStatus.ACCEPTED }), nowMs),
    ).toBeFalse();
    expect(
      isInviteActive(makeInvite({ status: AdminInviteStatus.REVOKED }), nowMs),
    ).toBeFalse();
  });

  it('should hydrate access requests and invitations preserving the Firestore document ID', () => {
    const req = accessRequestSchema.parse({
      email: 'ana@example.com',
      displayName: 'Ana',
      source: AccessRequestSource.EMAIL,
      status: AccessRequestStatus.PENDING,
      createdAt: Timestamp.fromMillis(nowMs),
      id: 'req-1',
    });
    expect(req.id).toBe('req-1');
    expect(req.source).toBe(AccessRequestSource.EMAIL);

    const inv = adminInviteSchema.parse({
      email: 'ana@example.com',
      targetRole: UserRole.ADMIN,
      status: AdminInviteStatus.PENDING,
      requiresProfileCompletion: false,
      createdAt: Timestamp.fromMillis(nowMs),
      expiresAt: Timestamp.fromMillis(nowMs + 1000),
      createdBy: 'admin@example.com',
      id: 'inv-1',
    });
    expect(inv.targetRole).toBe(UserRole.ADMIN);
  });

  it('should reject corrupted onboarding records with unknown roles or missing email before exposing them', () => {
    expect(() =>
      adminInviteSchema.parse({
        email: 'ana@example.com',
        targetRole: 'INVALID_ROLE',
        status: AdminInviteStatus.PENDING,
        requiresProfileCompletion: false,
        createdAt: Timestamp.fromMillis(nowMs),
        expiresAt: Timestamp.fromMillis(nowMs + 1000),
        createdBy: 'admin@example.com',
        id: 'inv-bad',
      }),
    ).toThrowError(/targetRole/);

    expect(() =>
      accessRequestSchema.parse({
        email: '',
        displayName: 'Ana',
        source: AccessRequestSource.EMAIL,
        status: AccessRequestStatus.PENDING,
        createdAt: Timestamp.fromMillis(nowMs),
        id: 'req-bad',
      }),
    ).toThrowError(/email/);
  });

  describe('AccessOnboardingService business guardrails', () => {
    const authSpy = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(null),
    };

    let service: AccessOnboardingService;

    beforeEach(() => {
      authSpy.getCurrentUser.calls.reset();
      authSpy.getCurrentUser.and.returnValue(null);

      const app = initializeApp(
        {
          projectId: 'demo-test',
          apiKey: 'test-api-key',
          appId: '1:1:web:test',
        },
        `auth-onboarding-spec-${Math.random()}`,
      );

      TestBed.configureTestingModule({
        providers: [
          AccessOnboardingService,
          { provide: FIRESTORE_DB, useValue: getFirestore(app) },
          { provide: AuthService, useValue: authSpy },
        ],
      });

      service = TestBed.inject(AccessOnboardingService);
    });

    it('should reject a Google access request when the Google account has no valid email', async () => {
      await expectAsync(
        service.submitGoogleAccessRequest({ uid: 'u-1', email: '   ' }),
      ).toBeRejectedWithError(/correo válido/);
    });

    it('should reject an email access request when displayName or email is missing', async () => {
      await expectAsync(
        service.submitEmailAccessRequest('   ', 'Ana Pérez'),
      ).toBeRejectedWithError(/obligatorios/);

      await expectAsync(
        service.submitEmailAccessRequest('ana@example.com', '   '),
      ).toBeRejectedWithError(/obligatorios/);
    });

    it('should return null without querying when an invitation token is blank', async () => {
      expect(await service.getInviteByToken('   ')).toBeNull();
    });

    it('should require an active admin session before creating a direct invitation', async () => {
      await expectAsync(
        service.createDirectInvite('guest@example.com', UserRole.ADMIN, false),
      ).toBeRejectedWithError(/sesión de administrador/);
    });

    it('should refuse redeeming an expired or already-used invitation', async () => {
      const expiredInvite = makeInvite({
        expiresAt: Timestamp.fromMillis(Date.now() - 10_000),
      });

      await expectAsync(
        service.acceptInviteForAuthenticatedUser(expiredInvite, {
          uid: 'u-1',
          email: 'user@example.com',
        }),
      ).toBeRejectedWithError(/ya no es válida/);
    });

    it('should block invitation redemption when the signed-in Google email does not match the invited email', async () => {
      const activeInvite = makeInvite({
        email: 'invited@example.com',
        expiresAt: Timestamp.fromMillis(Date.now() + 60_000),
      });

      await expectAsync(
        service.acceptInviteForAuthenticatedUser(activeInvite, {
          uid: 'u-other',
          email: 'other@example.com',
        }),
      ).toBeRejectedWithError(/correo invitado/);
    });
  });
});
