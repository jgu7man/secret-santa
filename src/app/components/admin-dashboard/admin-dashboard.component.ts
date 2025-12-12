import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { ParticipantService } from '../../services/participant.service';
import { Event } from '../../models/event.model';
import { Participant } from '../../models/participant.model';
import { MESSAGE_DISPLAY_DURATION, LONG_MESSAGE_DISPLAY_DURATION } from '../../constants';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  eventId: string = '';
  event: Event | null = null;
  participants: Participant[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  showRaffleConfirm = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private participantService: ParticipantService
  ) {}

  async ngOnInit(): Promise<void> {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.eventId) {
      this.router.navigate(['/']);
      return;
    }

    await this.loadEventData();
  }

  async loadEventData(): Promise<void> {
    this.isLoading = true;
    try {
      this.event = await this.eventService.getEvent(this.eventId);
      if (!this.event) {
        this.errorMessage = 'Event not found';
        return;
      }
      
      this.participants = await this.participantService.getParticipants(this.eventId);
    } catch (error: any) {
      console.error('Error loading event data:', error);
      this.errorMessage = 'Failed to load event data';
    } finally {
      this.isLoading = false;
    }
  }

  async toggleRegistration(): Promise<void> {
    if (!this.event) return;

    try {
      const newState = !this.event.isRegistrationOpen;
      await this.eventService.toggleRegistration(this.eventId, newState);
      this.event.isRegistrationOpen = newState;
      this.successMessage = `Registration ${newState ? 'opened' : 'closed'} successfully`;
      setTimeout(() => this.successMessage = '', MESSAGE_DISPLAY_DURATION);
    } catch (error: any) {
      console.error('Error toggling registration:', error);
      this.errorMessage = 'Failed to toggle registration';
    }
  }

  confirmRaffle(): void {
    this.showRaffleConfirm = true;
  }

  cancelRaffle(): void {
    this.showRaffleConfirm = false;
  }

  async runRaffle(): Promise<void> {
    this.showRaffleConfirm = false;
    
    if (this.participants.length < 2) {
      this.errorMessage = 'Need at least 2 participants to run the raffle';
      return;
    }

    try {
      await this.eventService.runRaffle(this.eventId);
      await this.loadEventData();
      this.successMessage = 'Raffle completed successfully! 🎉';
      setTimeout(() => this.successMessage = '', LONG_MESSAGE_DISPLAY_DURATION);
    } catch (error: any) {
      console.error('Error running raffle:', error);
      this.errorMessage = error.message || 'Failed to run raffle';
    }
  }

  copyParticipantLink(): void {
    const link = `${window.location.origin}/event/${this.eventId}`;
    navigator.clipboard.writeText(link);
    this.successMessage = 'Participant link copied to clipboard!';
    setTimeout(() => this.successMessage = '', MESSAGE_DISPLAY_DURATION);
  }

  copyResetLink(participantId: string): void {
    const link = `${window.location.origin}/event/${this.eventId}/reset/${participantId}`;
    navigator.clipboard.writeText(link);
    this.successMessage = 'Reset link copied to clipboard!';
    setTimeout(() => this.successMessage = '', MESSAGE_DISPLAY_DURATION);
  }

  get canRunRaffle(): boolean {
    return this.event?.status === 'CREATED' && this.participants.length >= 2;
  }

  get isDrawn(): boolean {
    return this.event?.status === 'DRAWN';
  }

  get canRevealResults(): boolean {
    return this.isDrawn && this.event?.revealToHost === true;
  }
}
