import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { EventService } from '../../services/event.service';
import { ParticipantService } from '../../services/participant.service';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

  const mockEventService = {
    getEvent: jasmine
      .createSpy('getEvent')
      .and.returnValue(Promise.resolve(null)),
    assignOwner: jasmine
      .createSpy('assignOwner')
      .and.returnValue(Promise.resolve()),
  };

  const mockParticipantService = {
    getParticipants: jasmine
      .createSpy('getParticipants')
      .and.returnValue(Promise.resolve([])),
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
      imports: [AdminDashboardComponent],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: ParticipantService, useValue: mockParticipantService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
