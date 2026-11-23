import { ErrorHandler } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@marxa/auth-engine';
import { EventService, ParticipantService } from '@secret-santa/data-access';
import { Event, EventStatus, Participant } from '@secret-santa/domain';
import { Timestamp } from 'firebase/firestore';
import { of } from 'rxjs';
import { EventLandingComponent } from './event-landing.component';

describe('EventLandingComponent (Business Flows)', () => {
  let fixture: ComponentFixture<EventLandingComponent>;
  let eventServiceSpy: jasmine.SpyObj<EventService>;
  let participantServiceSpy: jasmine.SpyObj<ParticipantService>;
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

  const sampleParticipant: Participant = {
    id: 'part-1',
    name: 'Jorge',
    normalizedName: 'jorge',
    preferences: { general: 'Taza de café' },
    assignedToId: null,
    assignedToName: null,
  };

  beforeEach(async () => {
    eventServiceSpy = jasmine.createSpyObj<EventService>('EventService', [
      'getEvent',
      'deleteParticipant',
    ]);
    eventServiceSpy.getEvent.and.resolveTo(closedEvent);
    eventServiceSpy.deleteParticipant.and.resolveTo();

    participantServiceSpy = jasmine.createSpyObj<ParticipantService>(
      'ParticipantService',
      [
        'getStoredParticipantId',
        'getParticipant',
        'getAssignedParticipant',
        'clearParticipantSession',
      ]
    );
    participantServiceSpy.getStoredParticipantId.and.returnValue(null);
    participantServiceSpy.getParticipant.and.resolveTo(sampleParticipant);
    participantServiceSpy.getAssignedParticipant.and.resolveTo(null);

    errorHandlerSpy = jasmine.createSpyObj<ErrorHandler>('ErrorHandler', [
      'handleError',
    ]);

    await TestBed.configureTestingModule({
      imports: [EventLandingComponent],
      providers: [
        { provide: EventService, useValue: eventServiceSpy },
        { provide: ParticipantService, useValue: participantServiceSpy },
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

  it('should place Welcome + 3-dot menu above the match reveal and keep Leave Event / Logout tucked inside the menu', async () => {
    participantServiceSpy.getStoredParticipantId.and.returnValue('part-1');

    const loggedFixture = TestBed.createComponent(EventLandingComponent);
    loggedFixture.detectChanges();
    await loggedFixture.whenStable();
    loggedFixture.detectChanges();

    const el: HTMLElement = loggedFixture.nativeElement;
    const welcomeEl = el.querySelector('h2.event-welcome');
    const revealEl = el.querySelector('app-event-match-reveal');
    expect(welcomeEl).not.toBeNull();
    expect(revealEl).not.toBeNull();
    // Welcome row precedes the match-reveal waiting card in DOM order
    expect(
      (welcomeEl!.compareDocumentPosition(revealEl!) &
        Node.DOCUMENT_POSITION_FOLLOWING) !==
        0
    ).toBeTrue();

    // Destructive actions are NOT exposed before opening the 3-dot menu
    expect(el.textContent).not.toContain('Leave Event');
    expect(el.textContent).not.toContain('Logout');

    // Opening the 3-dot menu exposes Logout and Leave Event with confirmation
    const menuTrigger: HTMLButtonElement | null = el.querySelector(
      'button[aria-haspopup="menu"]'
    );
    menuTrigger?.click();
    loggedFixture.detectChanges();

    const leaveItem = Array.from<HTMLButtonElement>(
      el.querySelectorAll('[role="menuitem"]')
    ).find((btn) => btn.textContent?.includes('Leave Event'));
    expect(leaveItem).toBeDefined();

    leaveItem?.click();
    loggedFixture.detectChanges();

    expect(eventServiceSpy.deleteParticipant).not.toHaveBeenCalled();
    expect(el.querySelector('app-confirm-dialog-modal')).not.toBeNull();
  });

  it('should hide Leave Event inside the participant menu once the raffle has been drawn', async () => {
    eventServiceSpy.getEvent.and.resolveTo({
      ...closedEvent,
      status: EventStatus.DRAWN,
    });
    participantServiceSpy.getStoredParticipantId.and.returnValue('part-1');

    const drawnFixture = TestBed.createComponent(EventLandingComponent);
    drawnFixture.detectChanges();
    await drawnFixture.whenStable();
    drawnFixture.detectChanges();

    const el: HTMLElement = drawnFixture.nativeElement;
    const menuTrigger: HTMLButtonElement | null = el.querySelector(
      'button[aria-haspopup="menu"]'
    );
    menuTrigger?.click();
    drawnFixture.detectChanges();

    expect(el.textContent).toContain('Logout');
    expect(el.textContent).not.toContain('Leave Event');
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
