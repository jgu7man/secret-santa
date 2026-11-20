import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, NgZone, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { User } from 'firebase/auth';
import { Event } from '../../models/event.model';
import { EventStatusPipe } from '../../pipes/event-status.pipe';
import { AuthService } from '../../core';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-host-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, EventStatusPipe],
  templateUrl: './host-dashboard.component.html',
  styleUrl: './host-dashboard.component.scss',
})
export class HostDashboardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  user: User | null = null;
  events: Event[] = [];
  participatingEvents: Event[] = [];
  isLoading = true;

  constructor(
    private authService: AuthService,
    private eventService: EventService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const currentUser = await this.authService.waitForAuthReady();
    if (!currentUser) {
      this.ngZone.run(() => {
        void this.router.navigate(['/login']);
      });
      return;
    }

    this.user = currentUser;
    await this.loadEvents(currentUser.uid);

    this.authService.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (!user) {
          this.user = null;
          this.events = [];
          void this.router.navigate(['/login']);
        }
      });
  }

  async loadEvents(userId: string) {
    this.isLoading = true;
    try {
      const [ownedEvents, participatingEvents] = await Promise.all([
        this.eventService.getEventsByOwner(userId),
        this.eventService.getEventsByParticipant(userId),
      ]);
      this.ngZone.run(() => {
        this.events = ownedEvents;
        this.participatingEvents = participatingEvents;
        this.isLoading = false;
        this.cdr.markForCheck();
      });
    } catch (error) {
      console.error('Error loading events', error);
      this.ngZone.run(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      });
    }
  }

  async logout() {
    try {
      await this.authService.logout();
      this.ngZone.run(() => {
        void this.router.navigate(['/login']);
      });
    } catch (error) {
      console.error('Logout failed', error);
    }
  }

  goToAdmin(eventId: string) {
    this.router.navigate(['/admin', eventId]);
  }

  goToEvent(eventId: string) {
    this.router.navigate(['/event', eventId]);
  }

  async deleteEvent(event: Event) {
    if (
      confirm(
        `Are you sure you want to delete "${event.name}"? This action cannot be undone.`
      )
    ) {
      try {
        await this.eventService.deleteEvent(event.id);
        this.events = this.events.filter((e) => e.id !== event.id);
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
      }
    }
  }
}
