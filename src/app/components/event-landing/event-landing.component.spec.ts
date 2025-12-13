import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { EventService } from '../../services/event.service';
import { ParticipantService } from '../../services/participant.service';
import { EventLandingComponent } from './event-landing.component';

describe('EventLandingComponent', () => {
  let component: EventLandingComponent;
  let fixture: ComponentFixture<EventLandingComponent>;

  const mockEventService = {
    getEvent: jasmine
      .createSpy('getEvent')
      .and.returnValue(Promise.resolve(null)),
  };

  const mockParticipantService = {
    getStoredParticipantId: jasmine
      .createSpy('getStoredParticipantId')
      .and.returnValue(null),
    clearParticipantSession: jasmine.createSpy('clearParticipantSession'),
  };

  const mockAuthService = {
    user$: of(null),
    getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(null),
    loginWithGoogle: jasmine
      .createSpy('loginWithGoogle')
      .and.returnValue(Promise.resolve()),
  };

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: () => 'test-event-id',
      },
    },
  };

  const mockRouter = {
    navigate: jasmine.createSpy('navigate'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventLandingComponent],
      providers: [
        FormBuilder,
        { provide: EventService, useValue: mockEventService },
        { provide: ParticipantService, useValue: mockParticipantService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventLandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
