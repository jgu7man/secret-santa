import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { AuthSessionService, AuthSessionStatus } from '@marxa/auth-engine';
import { AuthService } from '@secret-santa/shared-core';
import { AuthLoginComponent } from './auth-login.component';

describe('AuthLoginComponent', () => {
  let fixture: ComponentFixture<AuthLoginComponent>;
  let component: AuthLoginComponent;

  const authServiceSpy = {
    loginWithGoogle: jasmine.createSpy('loginWithGoogle').and.resolveTo(),
  };

  const authSessionSpy = {
    verifyOrLogoutAdmin: jasmine.createSpy('verifyOrLogoutAdmin'),
  };

  beforeEach(async () => {
    authServiceSpy.loginWithGoogle.calls.reset();
    authSessionSpy.verifyOrLogoutAdmin.calls.reset();

    await TestBed.configureTestingModule({
      imports: [AuthLoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AuthSessionService, useValue: authSessionSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: { get: () => null },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should warn the user that their account has no admin permissions after signing in with an unauthorized Google account', async () => {
    authSessionSpy.verifyOrLogoutAdmin.and.resolveTo(
      AuthSessionStatus.UNAUTHORIZED
    );

    await component.loginWithGoogle();
    fixture.detectChanges();

    expect(component.accessDenied()).toBeTrue();
    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Acceso restringido');
  });

  it('should redirect an authorized administrator to the configured landing route right after Google sign-in', async () => {
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    authSessionSpy.verifyOrLogoutAdmin.and.resolveTo(
      AuthSessionStatus.AUTHORIZED
    );

    await component.loginWithGoogle();

    expect(navSpy).toHaveBeenCalledWith('/stats');
  });

  it('should display the unauthorized notice when redirected back to login with reason=unauthorized', () => {
    const route = TestBed.inject(ActivatedRoute);
    spyOn(route.snapshot.queryParamMap, 'get').and.returnValue('unauthorized');

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.accessDenied()).toBeTrue();
    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Acceso restringido');
  });
});
