import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  output,
} from '@angular/core';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CreateEventData,
  Event,
  formatDateForDateTimeLocal,
} from '@secret-santa/domain';

@Component({
  selector: 'app-admin-edit-event-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-edit-event-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeModal.emit()',
  },
})
export class AdminEditEventModalComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly event = input.required<Event>();
  readonly saveEvent = output<Partial<CreateEventData>>();
  readonly closeModal = output<void>();

  protected readonly editForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    minAmount: [0, [Validators.required, Validators.min(0)]],
    maxAmount: new FormControl<number | null>(null),
    registrationDeadline: new FormControl<string | null>(null),
  });

  ngOnInit(): void {
    const current = this.event();
    const deadline = current.registrationDeadline
      ? formatDateForDateTimeLocal(current.registrationDeadline.toDate())
      : null;

    this.editForm.patchValue({
      name: current.name,
      minAmount: current.minAmount,
      maxAmount: current.maxAmount ?? null,
      registrationDeadline: deadline,
    });
  }

  protected onSubmit(): void {
    if (this.editForm.invalid) {
      return;
    }
    this.saveEvent.emit(this.editForm.getRawValue());
  }
}
