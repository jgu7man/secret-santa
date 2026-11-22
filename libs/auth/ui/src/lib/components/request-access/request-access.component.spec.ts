import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  AccessOnboardingService,
  AccessRequestSource,
  AccessRequestStatus,
  AuthSessionService,
} from '@marxa/auth-engine';
import { Timestamp } from 'firebase/firestore';
import { RequestAccessComponent } from './request-access.component';

describe('RequestAccessComponent', () => {
  let fixture: ComponentFixture<RequestAccessComponent>;
  let component: RequestAccessComponent;

  const onboardingSpy = jasmine.createSpyObj<AccessOnboardingService>(
    'AccessOnboardingService',
    ['submitGoogleAccessRequest', 'submitEmailAccessRequest']
  );

  const authSessionSpy = {
    loginWithGoogle: jasmine.createSpy('loginWithGoogle').and.resolveTo(null),
  };

  beforeEach(async () => {
    onboardingSpy.submitEmailAccessRequest.and.resolveTo({
      id: 'req-1',
      email: 'ana@example.com',
      displayName: 'Ana',
      source: AccessRequestSource.EMAIL,
      status: AccessRequestStatus.PENDING,
      createdAt: Timestamp.now(),
    });

    await TestBed.configureTestingModule({
      imports: [RequestAccessComponent],
      providers: [
        provideRouter([]),
        { provide: AccessOnboardingService, useValue: onboardingSpy },
        { provide: AuthSessionService, useValue: authSessionSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should confirm to the applicant that their email access request was registered and is awaiting admin review', async () => {
    await component.submitEmailRequest({
      displayName: 'Ana Pérez',
      email: 'ana@example.com',
      reason: 'Soporte',
    });
    fixture.detectChanges();

    expect(onboardingSpy.submitEmailAccessRequest).toHaveBeenCalledWith(
      'ana@example.com',
      'Ana Pérez',
      'Soporte'
    );
    expect(component.submittedRequest()?.id).toBe('req-1');
    const statusBanner = fixture.nativeElement.querySelector('[role="status"]');
    expect(statusBanner?.textContent).toContain('Solicitud enviada');
  });
});
