import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { User } from 'firebase/auth';
import {
  LONG_MESSAGE_DISPLAY_DURATION,
  MESSAGE_DISPLAY_DURATION,
} from '../../constants';
import { Event } from '../../models/event.model';
import { Participant } from '../../models/participant.model';
import { AuthService } from '../../services/auth.service';
import { EventService } from '../../services/event.service';
import { ParticipantService } from '../../services/participant.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  eventId: string = '';
  event: Event | null = null;
  participants: Participant[] = [];
  currentUser: User | null = null;
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  showRaffleConfirm = false;
  showEditModal = false;
  editForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private participantService: ParticipantService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      minAmount: [0, [Validators.required, Validators.min(0)]],
      maxAmount: [null],
      registrationDeadline: [null],
    });
  }

  async ngOnInit(): Promise<void> {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.eventId) {
      this.router.navigate(['/']);
      return;
    }

    this.authService.user$.subscribe((user) => {
      this.currentUser = user;
    });

    await this.loadEventData();
  }

  async loadEventData(): Promise<void> {
    this.isLoading = true;
    try {
      this.event = await this.eventService.getEvent(this.eventId);
      if (!this.event) {
        this.errorMessage = $localize`:@@eventNotFound:Event not found`;
        return;
      }

      this.participants = await this.participantService.getParticipants(
        this.eventId
      );
    } catch (error: any) {
      console.error('Error loading event data:', error);
      this.errorMessage = $localize`:@@loadEventDataError:Failed to load event data`;
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

      const statusText = newState
        ? $localize`:@@registrationOpened:opened`
        : $localize`:@@registrationClosed:closed`;
      this.successMessage = $localize`:@@registrationToggleSuccess:Registration ${statusText} successfully`;

      setTimeout(() => (this.successMessage = ''), MESSAGE_DISPLAY_DURATION);
    } catch (error: any) {
      console.error('Error toggling registration:', error);
      this.errorMessage = $localize`:@@toggleRegistrationError:Failed to toggle registration`;
    }
  }

  confirmRaffle(): void {
    this.showRaffleConfirm = true;
  }

  cancelRaffle(): void {
    this.showRaffleConfirm = false;
  }

  openEditModal(): void {
    if (!this.event) return;

    let deadline = null;
    if (this.event.registrationDeadline) {
      const date = this.event.registrationDeadline.toDate();
      // Format to YYYY-MM-DDThh:mm for datetime-local input
      const offset = date.getTimezoneOffset() * 60000;
      deadline = new Date(date.getTime() - offset).toISOString().slice(0, 16);
    }

    this.editForm.patchValue({
      name: this.event.name,
      minAmount: this.event.minAmount,
      maxAmount: this.event.maxAmount,
      registrationDeadline: deadline,
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  async updateEvent(): Promise<void> {
    if (this.editForm.invalid || !this.event) return;

    try {
      const formValue = this.editForm.value;
      await this.eventService.updateEvent(this.eventId, formValue);

      // Update local state
      this.event.name = formValue.name;
      this.event.minAmount = formValue.minAmount;
      this.event.maxAmount = formValue.maxAmount;
      // Reload to get proper timestamp
      await this.loadEventData();

      this.successMessage = $localize`:@@eventUpdatedSuccess:Event updated successfully!`;
      this.showEditModal = false;
      setTimeout(() => (this.successMessage = ''), MESSAGE_DISPLAY_DURATION);
    } catch (error: any) {
      console.error('Error updating event:', error);
      this.errorMessage = $localize`:@@eventUpdateError:Failed to update event`;
    }
  }

  navigateToEvent(): void {
    this.router.navigate(['/event', this.eventId]);
  }

  async runRaffle(): Promise<void> {
    this.showRaffleConfirm = false;

    if (this.participants.length < 2) {
      this.errorMessage = $localize`:@@minParticipantsError:Need at least 2 participants to run the raffle`;
      return;
    }

    try {
      await this.eventService.runRaffle(this.eventId);
      await this.loadEventData();
      this.successMessage = $localize`:@@raffleSuccess:Raffle completed successfully! 🎉`;
      setTimeout(
        () => (this.successMessage = ''),
        LONG_MESSAGE_DISPLAY_DURATION
      );
    } catch (error: any) {
      console.error('Error running raffle:', error);
      this.errorMessage =
        error.message || $localize`:@@raffleError:Failed to run raffle`;
    }
  }

  copyParticipantLink(): void {
    const link = `${window.location.origin}/event/${this.eventId}`;
    navigator.clipboard.writeText(link);
    this.successMessage = $localize`:@@copyLinkSuccess:Participant link copied to clipboard!`;
    setTimeout(() => (this.successMessage = ''), MESSAGE_DISPLAY_DURATION);
  }

  copyResetLink(participantId: string): void {
    const link = `${window.location.origin}/event/${this.eventId}/reset/${participantId}`;
    navigator.clipboard.writeText(link);
    this.successMessage = $localize`:@@copyResetLinkSuccess:Reset link copied to clipboard!`;
    setTimeout(() => (this.successMessage = ''), MESSAGE_DISPLAY_DURATION);
  }

  get canRunRaffle(): boolean {
    return (
      (this.event?.status === 'CREATED' || this.event?.status === 'DRAWN') &&
      this.participants.length >= 2
    );
  }

  async deleteParticipant(participantId: string): Promise<void> {
    if (
      !confirm(
        $localize`:@@deleteParticipantConfirm:Are you sure you want to remove this participant? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      this.isLoading = true;
      await this.eventService.deleteParticipant(this.eventId, participantId);
      this.successMessage = $localize`:@@deleteParticipantSuccess:Participant removed successfully`;
      await this.loadEventData(); // Reload to get updated list and status
    } catch (error: any) {
      console.error('Error deleting participant:', error);
      this.errorMessage =
        error.message ||
        $localize`:@@deleteParticipantError:Failed to remove participant`;
    } finally {
      this.isLoading = false;
      setTimeout(() => (this.successMessage = ''), MESSAGE_DISPLAY_DURATION);
    }
  }

  get isDrawn(): boolean {
    return this.event?.status === 'DRAWN';
  }

  get canRevealResults(): boolean {
    return this.isDrawn && this.event?.revealToHost === true;
  }

  get canClaimEvent(): boolean {
    return !!this.event && !this.event.ownerId;
  }

  async claimEvent(): Promise<void> {
    if (!this.event) return;

    try {
      let user = this.currentUser;
      if (!user) {
        await this.authService.loginWithGoogle();
        user = this.authService.getCurrentUser();
      }

      if (user) {
        await this.eventService.assignOwner(this.eventId, user.uid);
        this.event.ownerId = user.uid;
        this.successMessage = $localize`:@@claimEventSuccess:Event successfully linked to your account!`;
        setTimeout(() => (this.successMessage = ''), MESSAGE_DISPLAY_DURATION);
      }
    } catch (error: any) {
      console.error('Error claiming event:', error);
      this.errorMessage = $localize`:@@claimEventError:Failed to claim event`;
    }
  }
}
