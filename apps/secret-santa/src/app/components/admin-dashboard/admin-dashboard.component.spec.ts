import { ErrorHandler } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@marxa/auth-engine';
import { EventService, ParticipantService } from '@secret-santa/data-access';
import { Event, EventStatus } from '@secret-santa/domain';
import { Timestamp } from 'firebase/firestore';
import { of } from 'rxjs';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let eventServiceSpy: jasmine.SpyObj<EventService>;
  let participantServiceSpy: jasmine.SpyObj<ParticipantService>;
  let errorHandlerSpy: jasmine.SpyObj<ErrorHandler>;

  const sampleEvent: Event = {
    id: 'test-event-id',
    adminToken: 'tok-123',
    name: 'Navidad Oficina',
    minAmount: 25,
    revealToHost: false,
    isRegistrationOpen: true,
    status: EventStatus.CREATED,
    createdAt: Timestamp.now(),
    ownerId: 'owner-1',
  };

  beforeEach(async () => {
    eventServiceSpy = jasmine.createSpyObj<EventService>('EventService', [
      'getEvent',
      'assignOwner',
      'toggleRegistration',
      'runRaffle',
      'deleteParticipant',
    ]);
    eventServiceSpy.getEvent.and.resolveTo(sampleEvent);

    participantServiceSpy = jasmine.createSpyObj<ParticipantService>(
      'ParticipantService',
      ['getParticipants']
    );
    participantServiceSpy.getParticipants.and.resolveTo([]);

    errorHandlerSpy = jasmine.createSpyObj<ErrorHandler>('ErrorHandler', [
      'handleError',
    ]);

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        { provide: EventService, useValue: eventServiceSpy },
        { provide: ParticipantService, useValue: participantServiceSpy },
        {
          provide: AuthService,
          useValue: {
            user$: of(null),
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

    fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should render the loaded event heading and hide the raffle button with fewer than 2 participants', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Navidad Oficina');
    expect(el.textContent).not.toContain('Run Raffle');
  });

  it('should report Firestore load failures to ErrorHandler and display an alert to the organizer', async () => {
    const failure = new Error('Firestore permission denied');
    eventServiceSpy.getEvent.and.rejectWith(failure);

    const failingFixture = TestBed.createComponent(AdminDashboardComponent);
    failingFixture.detectChanges();
    await failingFixture.whenStable();
    failingFixture.detectChanges();

    expect(errorHandlerSpy.handleError).toHaveBeenCalledWith(failure);
    const alertEl: HTMLElement | null =
      failingFixture.nativeElement.querySelector('[role="alert"]');
    expect(alertEl?.textContent).toContain('Failed to load event data');
  });
});
