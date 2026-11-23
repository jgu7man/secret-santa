import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-admin-event-menu',
  standalone: true,
  templateUrl: './admin-event-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEventMenuComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly canClaimEvent = input.required<boolean>();
  readonly canDeleteEvent = input.required<boolean>();

  readonly editEvent = output<void>();
  readonly claimEvent = output<void>();
  readonly deleteEvent = output<void>();

  protected readonly isOpen = signal(false);

  protected toggleMenu(): void {
    this.isOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.isOpen.set(false);
  }

  protected onEdit(): void {
    this.closeMenu();
    this.editEvent.emit();
  }

  protected onClaim(): void {
    this.closeMenu();
    this.claimEvent.emit();
  }

  protected onDelete(): void {
    this.closeMenu();
    this.deleteEvent.emit();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) {
      return;
    }
    const target = event.target;
    if (
      target instanceof Node &&
      !this.elementRef.nativeElement.contains(target)
    ) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (this.isOpen()) {
      this.closeMenu();
    }
  }
}
