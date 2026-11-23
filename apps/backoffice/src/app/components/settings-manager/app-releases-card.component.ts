import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FirestoreTimestampPipe } from '@secret-santa/shared-core';
import { AppEnvironment, AppRelease } from '@secret-santa/shared-data-access';
import { CreateReleasePayload } from './settings-manager-ui.model';

@Component({
  selector: 'bo-app-releases-card',
  standalone: true,
  imports: [ReactiveFormsModule, FirestoreTimestampPipe],
  templateUrl: './app-releases-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppReleasesCardComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly appId = input.required<string>();
  readonly releases = input.required<readonly AppRelease[]>();
  readonly isCreating = input.required<boolean>();
  readonly publishRelease = output<CreateReleasePayload>();

  protected readonly environments: ReadonlyArray<AppEnvironment> = [
    AppEnvironment.DEV,
    AppEnvironment.BETA,
    AppEnvironment.PROD,
  ];

  protected readonly releaseForm = this.fb.group({
    version: ['', [Validators.required, Validators.maxLength(50)]],
    environment: [AppEnvironment.DEV as AppEnvironment, [Validators.required]],
    notes: ['', [Validators.maxLength(2000)]],
  });

  protected onSubmit(): void {
    if (this.releaseForm.invalid) {
      this.releaseForm.markAllAsTouched();
      return;
    }

    this.publishRelease.emit(this.releaseForm.getRawValue());
    this.releaseForm.reset({
      version: '',
      environment: AppEnvironment.DEV,
      notes: '',
    });
  }
}
