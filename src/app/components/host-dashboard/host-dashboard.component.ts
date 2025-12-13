import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { User } from 'firebase/auth';
import { Event } from '../../models/event.model';
import { EventStatusPipe } from '../../pipes/event-status.pipe';
import { AuthService } from '../../services/auth.service';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-host-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, EventStatusPipe],
  templateUrl: './host-dashboard.component.html',
  styleUrl: './host-dashboard.component.scss',
})
export class HostDashboardComponent implements OnInit {
  user: User | null = null;
  events: Event[] = [];
  isLoading = true;

  constructor(
    private authService: AuthService,
    private eventService: EventService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(async (user) => {
      this.user = user;
      if (user) {
        await this.loadEvents(user.uid);
      } else {
        this.events = [];
        this.isLoading = false;
      }
    });
  }

  async loadEvents(userId: string) {
    this.isLoading = true;
    try {
      this.events = await this.eventService.getEventsByOwner(userId);
    } catch (error) {
      console.error('Error loading events', error);
    } finally {
      this.isLoading = false;
    }
  }

  async login() {
    try {
      await this.authService.loginWithGoogle();
    } catch (error) {
      console.error('Login failed', error);
    }
  }

  async logout() {
    try {
      await this.authService.logout();
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
