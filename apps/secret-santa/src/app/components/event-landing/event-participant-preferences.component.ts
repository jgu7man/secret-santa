import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ParticipantPreferences } from '@secret-santa/domain';

@Component({
  selector: 'app-event-participant-preferences',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './event-participant-preferences.component.html',
  styleUrl: './event-participant-preferences.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventParticipantPreferencesComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly preferences = input.required<ParticipantPreferences>();
  readonly isSubmitting = input.required<boolean>();
  readonly savePreferences = output<ParticipantPreferences>();

  protected readonly isEditing = signal(false);
  protected readonly preferencesForm = this.fb.group({
    general: [''],
    sizes: [''],
  });

  constructor() {
    effect(() => {
      const prefs = this.preferences();
      this.preferencesForm.patchValue({
        general: prefs.general,
        sizes: prefs.sizes,
      });
      this.isEditing.set(false);
    });
  }

  protected startEditing(): void {
    const prefs = this.preferences();
    this.preferencesForm.patchValue({
      general: prefs.general,
      sizes: prefs.sizes,
    });
    this.isEditing.set(true);
  }

  protected cancelEditing(): void {
    this.isEditing.set(false);
  }

  protected onSubmit(): void {
    if (this.preferencesForm.invalid) {
      return;
    }
    this.savePreferences.emit(this.preferencesForm.getRawValue());
  }
}
