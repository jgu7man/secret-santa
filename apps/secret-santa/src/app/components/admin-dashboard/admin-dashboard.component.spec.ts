import { ErrorHandler } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@marxa/auth-engine';
import { EventService, ParticipantService } from '@secret-santa/data-access';
import { Event, EventStatus } from '@secret-santa/domain';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { BehaviorSubject, of } from 'rxjs';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent (Business Flows)', () => {
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let eventServiceSpy: jasmine.SpyObj<EventService>;
  let participantServiceSpy: jasmine.SpyObj<ParticipantService>;
  let errorHandlerSpy: jasmine.SpyObj<ErrorHandler>;
  let routerNavigateSpy: jasmine.Spy;
  let userSubject: BehaviorSubject<User | null>;

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
    userSubject = new BehaviorSubject<User | null>(null);
    routerNavigateSpy = jasmine
      .createSpy('navigate')
      .and.resolveTo(true);

    eventServiceSpy = jasmine.createSpyObj<EventService>('EventService', [
      'getEvent',
      'assignOwner',
      'toggleRegistration',
      'runRaffle',
      'deleteParticipant',
      'deleteEvent',
    ]);
    eventServiceSpy.getEvent.and.resolveTo(sampleEvent);
    eventServiceSpy.toggleRegistration.and.resolveTo();
    eventServiceSpy.deleteEvent.and.resolveTo();

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
            user$: userSubject.asObservable(),
            getCurrentUser: () => userSubject.value,
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
            navigate: routerNavigateSpy,
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

  it('should generate a recipient-free WhatsApp invite link containing the event name and participant URL', () => {
    const whatsappLink: HTMLAnchorElement | null =
      fixture.nativeElement.querySelector('a[href^="https://wa.me/"]');
    expect(whatsappLink).not.toBeNull();

    const href = whatsappLink?.getAttribute('href') ?? '';
    expect(href.startsWith('https://wa.me/?text=')).toBeTrue();

    const decodedMessage = decodeURIComponent(href.split('?text=')[1] ?? '');
    expect(decodedMessage).toContain('Navidad Oficina');
    expect(decodedMessage).toContain('/event/test-event-id');
  });

  it('should ask for confirmation before closing registration and only close it after the organizer confirms', async () => {
    const closeBtn = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button')
    ).find((btn) => btn.textContent?.includes('Close Registration'));
    expect(closeBtn).toBeDefined();

    closeBtn?.click();
    fixture.detectChanges();

    expect(eventServiceSpy.toggleRegistration).not.toHaveBeenCalled();
    const modal = fixture.nativeElement.querySelector(
      'app-confirm-dialog-modal'
    );
    expect(modal).not.toBeNull();
    expect(modal.textContent).toContain('Close registration?');

    const confirmBtn = Array.from<HTMLButtonElement>(
      modal.querySelectorAll('button')
    ).find((btn) => btn.textContent?.includes('Yes, close registration'));
    confirmBtn?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(eventServiceSpy.toggleRegistration).toHaveBeenCalledWith(
      'test-event-id',
      false
    );
  });

  it('should expose Delete Event in the 3-dot menu only to the event owner and redirect after confirmation', async () => {
    const openMenu = (): void => {
      const trigger: HTMLButtonElement | null =
        fixture.nativeElement.querySelector('button[aria-haspopup="menu"]');
      trigger?.click();
      fixture.detectChanges();
    };

    // Guest / non-owner must not see Delete Event
    openMenu();
    expect(fixture.nativeElement.textContent).not.toContain('Delete Event');
    openMenu(); // close

    // Event owner sees Delete Event and can confirm deletion
    userSubject.next({ uid: 'owner-1' } as User);
    fixture.detectChanges();

    openMenu();
    const deleteMenuItem = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('[role="menuitem"]')
    ).find((btn) => btn.textContent?.includes('Delete Event'));
    expect(deleteMenuItem).toBeDefined();

    deleteMenuItem?.click();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector(
      'app-confirm-dialog-modal'
    );
    expect(modal).not.toBeNull();

    const confirmBtn = Array.from<HTMLButtonElement>(
      modal.querySelectorAll('button')
    ).find((btn) => btn.textContent?.trim() === 'Delete');
    confirmBtn?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(eventServiceSpy.deleteEvent).toHaveBeenCalledWith('test-event-id');
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/dashboard']);
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
