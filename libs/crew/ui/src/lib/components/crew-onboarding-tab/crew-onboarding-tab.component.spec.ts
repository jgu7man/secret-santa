import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserRole } from '@secret-santa/shared-models';
import {
  CrewOnboardingTabComponent,
  DirectInviteSubmitEvent,
} from './crew-onboarding-tab.component';

describe('CrewOnboardingTabComponent', () => {
  let fixture: ComponentFixture<CrewOnboardingTabComponent>;
  let component: CrewOnboardingTabComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrewOnboardingTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CrewOnboardingTabComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('accessRequests', []);
    fixture.componentRef.setInput('invites', []);
    fixture.componentRef.setInput('roles', [
      UserRole.USER,
      UserRole.HOST,
      UserRole.ADMIN,
    ]);
    fixture.componentRef.setInput('defaultTargetRole', UserRole.HOST);
    fixture.componentRef.setInput('defaultRequiresProfile', true);
    fixture.componentRef.setInput('requestAccessRoute', '/request-access');
    fixture.componentRef.setInput('savingId', null);
    fixture.componentRef.setInput('lastGeneratedInviteUrl', '');
    fixture.detectChanges();
  });

  it('should prevent issuing a direct invitation when the target email is missing or invalid', () => {
    const emitted: DirectInviteSubmitEvent[] = [];
    component.createDirectInvite.subscribe((event) => emitted.push(event));

    component.inviteForm.setValue({
      email: 'correo-invalido',
      targetRole: UserRole.ADMIN,
      requiresProfileCompletion: false,
    });
    component.submitDirectInvite();

    expect(component.inviteForm.invalid).toBeTrue();
    expect(emitted.length).toBe(0);
  });

  it('should emit direct invitation payload and reset form defaults from app configuration after submission', () => {
    const emitted: DirectInviteSubmitEvent[] = [];
    component.createDirectInvite.subscribe((event) => emitted.push(event));

    component.inviteForm.setValue({
      email: 'nuevo@example.com',
      targetRole: UserRole.ADMIN,
      requiresProfileCompletion: false,
    });
    component.submitDirectInvite();

    expect(emitted).toEqual([
      {
        email: 'nuevo@example.com',
        targetRole: UserRole.ADMIN,
        requiresProfileCompletion: false,
      },
    ]);
    expect(component.inviteForm.getRawValue()).toEqual({
      email: '',
      targetRole: UserRole.HOST,
      requiresProfileCompletion: true,
    });
  });
});
