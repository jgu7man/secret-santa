import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AccessRequestSource, EmailAccessRequestPayload } from '@marxa/auth-engine';
import { RequestAccessFormComponent } from './request-access-form.component';

describe('RequestAccessFormComponent', () => {
  let fixture: ComponentFixture<RequestAccessFormComponent>;
  let component: RequestAccessFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestAccessFormComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestAccessFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isSubmitting', false);
    fixture.componentRef.setInput('loginRoute', '/login');
    fixture.detectChanges();
  });

  it('should clear previous submission errors when the applicant switches between Google and email tabs', () => {
    const emittedTabs: AccessRequestSource[] = [];
    component.tabChange.subscribe((tab) => emittedTabs.push(tab));

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click();
    fixture.detectChanges();

    expect(emittedTabs).toEqual([AccessRequestSource.EMAIL]);
  });

  it('should prevent submitting an email request without a valid name and email format', () => {
    const emittedPayloads: EmailAccessRequestPayload[] = [];
    component.emailRequest.subscribe((payload) => emittedPayloads.push(payload));

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click();
    fixture.detectChanges();

    component.emailForm.setValue({
      displayName: 'A',
      email: 'not-an-email',
      reason: 'Soporte',
    });
    fixture.detectChanges();

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));

    expect(component.emailForm.invalid).toBeTrue();
    expect(emittedPayloads.length).toBe(0);
  });

  it('should emit the email access request payload once required applicant details are valid', () => {
    const emittedPayloads: EmailAccessRequestPayload[] = [];
    component.emailRequest.subscribe((payload) => emittedPayloads.push(payload));

    component.emailForm.setValue({
      displayName: 'Ana Pérez',
      email: 'ana@example.com',
      reason: 'Gestión de eventos',
    });
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click();
    fixture.detectChanges();

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));

    expect(emittedPayloads).toEqual([
      {
        displayName: 'Ana Pérez',
        email: 'ana@example.com',
        reason: 'Gestión de eventos',
      },
    ]);
  });
});
