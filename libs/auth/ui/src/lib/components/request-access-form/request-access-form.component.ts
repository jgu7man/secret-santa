import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AccessRequestSource,
  EmailAccessRequestPayload,
} from '@marxa/auth-engine';
import { ActiveClassPipe } from '@secret-santa/shared-core';

/**
 * Presentational child component rendering the Google or email access request form.
 */
@Component({
  selector: 'marxa-request-access-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ActiveClassPipe,
  ],
  templateUrl: './request-access-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestAccessFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly isSubmitting = input.required<boolean>();
  readonly loginRoute = input.required<string>();

  readonly googleRequest = output<string>();
  readonly emailRequest = output<EmailAccessRequestPayload>();
  readonly tabChange = output<AccessRequestSource>();

  protected readonly RequestTab = AccessRequestSource;
  protected readonly activeTab = signal<AccessRequestSource>(
    AccessRequestSource.GOOGLE
  );

  protected readonly googleReasonControl = this.fb.nonNullable.control('', [
    Validators.maxLength(500),
  ]);

  readonly emailForm = this.fb.nonNullable.group({
    displayName: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(200)],
    ],
    email: [
      '',
      [Validators.required, Validators.email, Validators.maxLength(320)],
    ],
    reason: ['', [Validators.maxLength(500)]],
  });

  protected selectTab(tab: AccessRequestSource): void {
    this.activeTab.set(tab);
    this.tabChange.emit(tab);
  }

  protected submitGoogle(): void {
    this.googleRequest.emit(this.googleReasonControl.value);
  }

  protected submitEmail(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    this.emailRequest.emit(this.emailForm.getRawValue());
  }
}
