import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  AccessOnboardingService,
  AccessRequestSource,
  AccessRequestStatus,
  MxdUser,
} from '@marxa/auth-engine';
import { AuthService } from '@secret-santa/shared-core';
import { UserProfileService } from '@secret-santa/shared-firebase';
import { AppUser, UserRole, UserStatus } from '@secret-santa/shared-models';
import { Timestamp } from 'firebase/firestore';
import { CrewManagerComponent } from './crew-manager.component';

describe('CrewManagerComponent', () => {
  let fixture: ComponentFixture<CrewManagerComponent>;
  let component: CrewManagerComponent;

  const now = Timestamp.fromMillis(1_700_000_000_000);
  const sampleUsers: AppUser[] = [
    {
      uid: 'admin-1',
      email: 'admin@example.com',
      displayName: 'Admin Principal',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      createdAt: now,
      lastLoginAt: now,
    },
    {
      uid: 'user-2',
      email: 'ana@example.com',
      displayName: 'Ana Pérez',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      createdAt: now,
      lastLoginAt: now,
    },
  ];

  const userProfileSpy = jasmine.createSpyObj<UserProfileService>(
    'UserProfileService',
    ['getAllUsers', 'updateUserAdmin']
  );

  const onboardingSpy = jasmine.createSpyObj<AccessOnboardingService>(
    'AccessOnboardingService',
    [
      'listAccessRequests',
      'listInvites',
      'createDirectInvite',
      'approveAccessRequest',
      'rejectAccessRequest',
      'revokeInvite',
    ]
  );

  const authSpy = {
    waitForAuthReady: jasmine
      .createSpy('waitForAuthReady')
      .and.resolveTo({ uid: 'admin-1' } as MxdUser),
  };

  beforeEach(async () => {
    userProfileSpy.getAllUsers.and.resolveTo(sampleUsers);
    userProfileSpy.updateUserAdmin.and.resolveTo();
    userProfileSpy.updateUserAdmin.calls.reset();
    onboardingSpy.listAccessRequests.and.resolveTo([
      {
        id: 'req-1',
        email: 'new@example.com',
        displayName: 'Nuevo',
        source: AccessRequestSource.EMAIL,
        status: AccessRequestStatus.PENDING,
        createdAt: now,
      },
    ]);
    onboardingSpy.listInvites.and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [CrewManagerComponent],
      providers: [
        { provide: UserProfileService, useValue: userProfileSpy },
        { provide: AccessOnboardingService, useValue: onboardingSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CrewManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should prevent an administrator from accidentally suspending their own active account', async () => {
    await component.toggleStatus(sampleUsers[0]);

    expect(userProfileSpy.updateUserAdmin).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('propia cuenta');
  });

  it('should prevent an administrator from demoting their own admin role', async () => {
    await component.onRoleChange({ user: sampleUsers[0], rawRole: UserRole.HOST });

    expect(userProfileSpy.updateUserAdmin).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('propia cuenta');
  });

  it('should persist and reflect in the directory when an admin changes another crew member role', async () => {
    await component.onRoleChange({ user: sampleUsers[1], rawRole: UserRole.HOST });

    expect(userProfileSpy.updateUserAdmin).toHaveBeenCalledWith('user-2', {
      role: UserRole.HOST,
    });
    expect(
      component.users().find((u) => u.uid === 'user-2')?.role
    ).toBe(UserRole.HOST);
  });

  it('should filter the crew directory simultaneously by search text, role, and account status', () => {
    expect(component.filteredUsers().length).toBe(2);
    expect(component.pendingRequestsCount()).toBe(1);

    component.onRoleFilterChange(UserRole.USER);
    component.onStatusFilterChange(UserStatus.ACTIVE);
    component.searchQuery.set('ana');

    expect(component.filteredUsers().map((u) => u.uid)).toEqual(['user-2']);

    component.onStatusFilterChange(UserStatus.SUSPENDED);
    expect(component.filteredUsers().length).toBe(0);
  });

  it('should show a clear error without corrupting the pending queue when approving a request fails', async () => {
    onboardingSpy.approveAccessRequest.and.rejectWith(new Error('Network error'));

    const pendingRequest = component.accessRequests()[0];
    await component.approveRequest(pendingRequest);

    expect(component.errorMessage()).toContain('No se pudo aprobar');
    expect(component.accessRequests()[0].status).toBe(
      AccessRequestStatus.PENDING
    );
    expect(component.pendingRequestsCount()).toBe(1);
  });
});
