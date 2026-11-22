import { ErrorHandler } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@marxa/auth-engine';
import { EventService, ParticipantService } from '@secret-santa/data-access';
import { Event, EventStatus } from '@secret-santa/domain';
import { Timestamp } from 'firebase/firestore';
import { of } from 'rxjs';
import { EventLandingComponent } from './event-landing.component';

describe('EventLandingComponent', () => {
  let fixture: ComponentFixture<EventLandingComponent>;
  let eventServiceSpy: jasmine.SpyObj<EventService>;
  let errorHandlerSpy: jasmine.SpyObj<ErrorHandler>;

  const closedEvent: Event = {
    id: 'test-event-id',
    adminToken: 'tok-123',
    name: 'Posada Familiar',
    minAmount: 15,
    revealToHost: false,
    isRegistrationOpen: false,
    status: EventStatus.CREATED,
    createdAt: Timestamp.now(),
    ownerId: 'owner-1',
  };

  beforeEach(async () => {
    eventServiceSpy = jasmine.createSpyObj<EventService>('EventService', [
      'getEvent',
      'deleteParticipant',
    ]);
    eventServiceSpy.getEvent.and.resolveTo(closedEvent);

    errorHandlerSpy = jasmine.createSpyObj<ErrorHandler>('ErrorHandler', [
      'handleError',
    ]);

    await TestBed.configureTestingModule({
      imports: [EventLandingComponent],
      providers: [
        { provide: EventService, useValue: eventServiceSpy },
        {
          provide: ParticipantService,
          useValue: {
            getStoredParticipantId: () => null,
            clearParticipantSession: jasmine.createSpy('clearParticipantSession'),
          },
        },
        {
          provide: AuthService,
          useValue: {
            user$: of(null),
            waitForAuthReady: () => Promise.resolve(null),
            getCurrentUser: () => null,
            loginWithGoogle: jasmine.createSpy('loginWithGoogle'),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'test-event-id' } },
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: jasmine.createSpy('navigate'),
            events: of(),
            createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
            serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue(''),
          },
        },
        { provide: ErrorHandler, useValue: errorHandlerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventLandingComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should display the closed registration notice and switch guests to login when registration is closed', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Posada Familiar');
    expect(el.textContent).toContain('Registration is currently closed');
  });

  it('should report event load errors to ErrorHandler instead of silently swallowing them', async () => {
    const failure = new Error('Network offline');
    eventServiceSpy.getEvent.and.rejectWith(failure);

    const failingFixture = TestBed.createComponent(EventLandingComponent);
    failingFixture.detectChanges();
    await failingFixture.whenStable();
    failingFixture.detectChanges();

    expect(errorHandlerSpy.handleError).toHaveBeenCalledWith(failure);
    const alertEl: HTMLElement | null =
      failingFixture.nativeElement.querySelector('[role="alert"]');
    expect(alertEl?.textContent).toContain('Failed to load event');
  });
});
