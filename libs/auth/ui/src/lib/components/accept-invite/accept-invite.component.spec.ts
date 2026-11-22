import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import {
  AccessOnboardingService,
  AdminInvite,
  AdminInviteStatus,
  AuthSessionService,
  MxdUser,
} from '@marxa/auth-engine';
import { UserRole, UserStatus } from '@secret-santa/shared-models';
import { Timestamp } from 'firebase/firestore';
import { AcceptInviteComponent } from './accept-invite.component';

describe('AcceptInviteComponent', () => {
  let fixture: ComponentFixture<AcceptInviteComponent>;
  let component: AcceptInviteComponent;

  const activeInvite: AdminInvite = {
    id: 'tok-123',
    email: 'invited@example.com',
    targetRole: UserRole.ADMIN,
    status: AdminInviteStatus.PENDING,
    requiresProfileCompletion: false,
    createdAt: Timestamp.fromMillis(Date.now() - 10_000),
    expiresAt: Timestamp.fromMillis(Date.now() + 60_000),
    createdBy: 'admin@example.com',
  };

  const onboardingSpy = jasmine.createSpyObj<AccessOnboardingService>(
    'AccessOnboardingService',
    ['getInviteByToken', 'acceptInviteForAuthenticatedUser']
  );

  const authSessionSpy = {
    waitForMxdUser: jasmine.createSpy('waitForMxdUser').and.resolveTo(null),
    loginWithGoogle: jasmine.createSpy('loginWithGoogle').and.resolveTo(null),
    logout: jasmine.createSpy('logout').and.resolveTo(),
  };

  beforeEach(async () => {
    onboardingSpy.getInviteByToken.calls.reset();
    onboardingSpy.acceptInviteForAuthenticatedUser.calls.reset();
    authSessionSpy.waitForMxdUser.calls.reset();
    authSessionSpy.loginWithGoogle.calls.reset();
    authSessionSpy.logout.calls.reset();

    onboardingSpy.getInviteByToken.and.resolveTo(activeInvite);
    onboardingSpy.acceptInviteForAuthenticatedUser.and.resolveTo({
      uid: 'u-inv',
      email: 'invited@example.com',
      displayName: 'Invited',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
    });

    await TestBed.configureTestingModule({
      imports: [AcceptInviteComponent],
      providers: [
        provideRouter([]),
        { provide: AccessOnboardingService, useValue: onboardingSpy },
        { provide: AuthSessionService, useValue: authSessionSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: () => 'tok-123' },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AcceptInviteComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  it('should activate the invited user access and enter the app immediately when no profile completion is required', async () => {
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    const user: MxdUser = { uid: 'u-inv', email: 'invited@example.com' };
    authSessionSpy.loginWithGoogle.and.resolveTo(user);

    await component.continueWithGoogle();

    expect(onboardingSpy.acceptInviteForAuthenticatedUser).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith('/stats');
  });

  it('should advise the user when the invitation link is expired or was already used', async () => {
    onboardingSpy.getInviteByToken.and.resolveTo({
      ...activeInvite,
      expiresAt: Timestamp.fromMillis(Date.now() - 10_000),
    });

    await component.ngOnInit();
    fixture.detectChanges();

    expect(component.isInviteValid()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain(
      'Invitación expirada o utilizada'
    );
  });

  it('should advise the user to switch Google account when signed in with a different email than the invite', async () => {
    authSessionSpy.loginWithGoogle.and.resolveTo({
      uid: 'u-other',
      email: 'wrong@example.com',
    });

    await component.continueWithGoogle();
    fixture.detectChanges();

    expect(
      onboardingSpy.acceptInviteForAuthenticatedUser
    ).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('Cambia de cuenta');
  });

  it('should ask the invited user to complete their display name before activating access when profile completion is required', async () => {
    onboardingSpy.getInviteByToken.and.resolveTo({
      ...activeInvite,
      requiresProfileCompletion: true,
    });
    await component.ngOnInit();

    authSessionSpy.loginWithGoogle.and.resolveTo({
      uid: 'u-inv',
      email: 'invited@example.com',
      displayName: 'Ana',
    });

    await component.continueWithGoogle();
    fixture.detectChanges();

    expect(component.awaitingProfileForm()).toBeTrue();
    expect(
      onboardingSpy.acceptInviteForAuthenticatedUser
    ).not.toHaveBeenCalled();

    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    await component.submitProfileAndAccept();

    expect(onboardingSpy.acceptInviteForAuthenticatedUser).toHaveBeenCalledWith(
      jasmine.objectContaining({ id: 'tok-123' }),
      jasmine.objectContaining({ uid: 'u-inv' }),
      { displayName: 'Ana' }
    );
    expect(navSpy).toHaveBeenCalledWith('/stats');
  });
});
