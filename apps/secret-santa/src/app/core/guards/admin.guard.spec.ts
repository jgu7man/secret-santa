import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { AuthService } from '@marxa/auth-engine';
import { EventService } from '@secret-santa/data-access';
import { Event, EventStatus } from '@secret-santa/domain';
import { Timestamp } from 'firebase/firestore';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  let eventServiceSpy: jasmine.SpyObj<EventService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let errorHandlerSpy: jasmine.SpyObj<ErrorHandler>;
  let router: Router;

  const mockRoute = (id: string | null): ActivatedRouteSnapshot =>
    ({
      paramMap: {
        get: (key: string) => (key === 'id' ? id : null),
      },
    }) as unknown as ActivatedRouteSnapshot;

  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    eventServiceSpy = jasmine.createSpyObj<EventService>('EventService', [
      'getStoredAdminToken',
      'verifyAdminToken',
      'getEvent',
    ]);
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'waitForAuthReady',
    ]);
    errorHandlerSpy = jasmine.createSpyObj<ErrorHandler>('ErrorHandler', [
      'handleError',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: eventServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ErrorHandler, useValue: errorHandlerSpy },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should redirect to home when the route has no event id', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      adminGuard(mockRoute(null), mockState)
    );

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });

  it('should grant access to a guest host holding a valid stored admin token', async () => {
    eventServiceSpy.getStoredAdminToken.and.returnValue('valid-token');
    eventServiceSpy.verifyAdminToken.and.resolveTo(true);

    const result = await TestBed.runInInjectionContext(() =>
      adminGuard(mockRoute('evt-1'), mockState)
    );

    expect(result).toBeTrue();
    expect(authServiceSpy.waitForAuthReady).not.toHaveBeenCalled();
  });

  it('should wait for Firebase Auth readiness and grant access to the event owner', async () => {
    const ownedEvent: Event = {
      id: 'evt-1',
      adminToken: 'secret',
      name: 'Navidad',
      minAmount: 20,
      revealToHost: false,
      isRegistrationOpen: true,
      status: EventStatus.CREATED,
      createdAt: Timestamp.now(),
      ownerId: 'host-uid',
    };

    eventServiceSpy.getStoredAdminToken.and.returnValue(null);
    authServiceSpy.waitForAuthReady.and.resolveTo({
      uid: 'host-uid',
    } as never);
    eventServiceSpy.getEvent.and.resolveTo(ownedEvent);

    const result = await TestBed.runInInjectionContext(() =>
      adminGuard(mockRoute('evt-1'), mockState)
    );

    expect(result).toBeTrue();
  });

  it('should report unexpected verification errors and redirect to admin login', async () => {
    const boom = new Error('Firestore unavailable');
    eventServiceSpy.getStoredAdminToken.and.returnValue('tok');
    eventServiceSpy.verifyAdminToken.and.rejectWith(boom);

    const result = await TestBed.runInInjectionContext(() =>
      adminGuard(mockRoute('evt-1'), mockState)
    );

    expect(errorHandlerSpy.handleError).toHaveBeenCalledWith(boom);
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/admin/evt-1/login');
  });
});
