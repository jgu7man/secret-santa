import { ErrorHandler } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { EventService, ParticipantService } from '@secret-santa/data-access';
import { PasswordResetComponent } from './password-reset.component';

describe('PasswordResetComponent', () => {
  let fixture: ComponentFixture<PasswordResetComponent>;
  let participantServiceSpy: jasmine.SpyObj<ParticipantService>;
  let errorHandlerSpy: jasmine.SpyObj<ErrorHandler>;

  beforeEach(async () => {
    participantServiceSpy = jasmine.createSpyObj<ParticipantService>(
      'ParticipantService',
      ['resetSecretWord']
    );
    errorHandlerSpy = jasmine.createSpyObj<ErrorHandler>('ErrorHandler', [
      'handleError',
    ]);

    await TestBed.configureTestingModule({
      imports: [PasswordResetComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) =>
                  key === 'id' ? 'evt-1' : key === 'participantId' ? 'p-1' : null,
              },
            },
          },
        },
        {
          provide: EventService,
          useValue: { getEvent: () => Promise.resolve(null) },
        },
        { provide: ParticipantService, useValue: participantServiceSpy },
        { provide: ErrorHandler, useValue: errorHandlerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordResetComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should prevent submitting when the confirmation secret word does not match', () => {
    const newWordInput: HTMLInputElement =
      fixture.nativeElement.querySelector('#newSecretWord');
    const confirmInput: HTMLInputElement =
      fixture.nativeElement.querySelector('#confirmSecretWord');
    const submitBtn: HTMLButtonElement =
      fixture.nativeElement.querySelector('button[type="submit"]');

    newWordInput.value = 'santa2026';
    newWordInput.dispatchEvent(new Event('input'));
    confirmInput.value = 'different';
    confirmInput.dispatchEvent(new Event('input'));
    confirmInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(submitBtn.disabled).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain(
      'Secret words do not match'
    );
  });

  it('should report secret word reset failures to ErrorHandler and render an error alert', async () => {
    const failure = new Error('Write failed');
    participantServiceSpy.resetSecretWord.and.rejectWith(failure);

    const newWordInput: HTMLInputElement =
      fixture.nativeElement.querySelector('#newSecretWord');
    const confirmInput: HTMLInputElement =
      fixture.nativeElement.querySelector('#confirmSecretWord');
    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');

    newWordInput.value = 'santa2026';
    newWordInput.dispatchEvent(new Event('input'));
    confirmInput.value = 'santa2026';
    confirmInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(errorHandlerSpy.handleError).toHaveBeenCalledWith(failure);
    const alertEl: HTMLElement | null =
      fixture.nativeElement.querySelector('[role="alert"]');
    expect(alertEl?.textContent).toContain('Failed to reset secret word');
  });
});
