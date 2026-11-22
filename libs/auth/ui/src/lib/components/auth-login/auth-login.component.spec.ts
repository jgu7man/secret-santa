import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { AuthSessionService, AuthSessionStatus } from '@marxa/auth-engine';
import { AuthLoginComponent } from './auth-login.component';

describe('AuthLoginComponent', () => {
  let fixture: ComponentFixture<AuthLoginComponent>;
  let component: AuthLoginComponent;

  const authSessionSpy = {
    loginWithGoogle: jasmine.createSpy('loginWithGoogle').and.resolveTo(null),
    verifyOrLogoutAdmin: jasmine.createSpy('verifyOrLogoutAdmin'),
  };

  beforeEach(async () => {
    authSessionSpy.loginWithGoogle.calls.reset();
    authSessionSpy.verifyOrLogoutAdmin.calls.reset();

    await TestBed.configureTestingModule({
      imports: [AuthLoginComponent],
      providers: [
        provideRouter([]),
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

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Acceso restringido');
  });

  it('should redirect an authorized administrator to the configured landing route right after Google sign-in', async () => {
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    authSessionSpy.verifyOrLogoutAdmin.and.resolveTo(
      AuthSessionStatus.AUTHORIZED
    );

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    button.click();
    await fixture.whenStable();

    expect(navSpy).toHaveBeenCalledWith('/stats');
  });

  it('should display the unauthorized notice when redirected back to login with reason=unauthorized', () => {
    const route = TestBed.inject(ActivatedRoute);
    spyOn(route.snapshot.queryParamMap, 'get').and.returnValue('unauthorized');

    component.ngOnInit();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Acceso restringido');
  });
});
