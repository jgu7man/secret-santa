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
  selector: 'app-event-participant-menu',
  standalone: true,
  templateUrl: './event-participant-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventParticipantMenuComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly canLeaveEvent = input.required<boolean>();

  readonly logout = output<void>();
  readonly leaveEvent = output<void>();

  protected readonly isOpen = signal(false);

  protected toggleMenu(): void {
    this.isOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.isOpen.set(false);
  }

  protected onLogout(): void {
    this.closeMenu();
    this.logout.emit();
  }

  protected onLeave(): void {
    this.closeMenu();
    this.leaveEvent.emit();
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
