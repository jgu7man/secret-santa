import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from '../firebase-config';
import { CreateEventData, Event, EventStatus } from '../models/event.model';
import { Participant } from '../models/participant.model';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private eventsCollection = collection(firestore, 'events');

  constructor() {}

  /**
   * Creates a new event and generates an admin token
   */
  async createEvent(
    data: CreateEventData,
    ownerId?: string
  ): Promise<{ eventId: string; adminToken: string }> {
    const adminToken = this.generateAdminToken();
    const eventRef = doc(this.eventsCollection);
    const eventId = eventRef.id;

    const newEvent: any = {
      adminToken,
      name: data.name,
      minAmount: data.minAmount,
      maxAmount: data.maxAmount,
      revealToHost: data.revealToHost,
      isRegistrationOpen: true,
      status: 'CREATED',
      createdAt: Timestamp.now(),
      ownerId: ownerId || null,
    };

    if (data.registrationDeadline) {
      newEvent.registrationDeadline = Timestamp.fromDate(
        new Date(data.registrationDeadline)
      );
    }

    await setDoc(eventRef, newEvent);

    // Store admin token in localStorage
    localStorage.setItem(`event_${eventId}_token`, adminToken);

    return { eventId, adminToken };
  }

  /**
   * Get events owned by a specific user
   */
  async getEventsByOwner(ownerId: string): Promise<Event[]> {
    const q = query(this.eventsCollection, where('ownerId', '==', ownerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Event)
    );
  }

  /**
   * Get event by ID
   */
  async getEvent(eventId: string): Promise<Event | null> {
    const eventRef = doc(this.eventsCollection, eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
      return null;
    }

    return {
      id: eventSnap.id,
      ...eventSnap.data(),
    } as Event;
  }

  /**
   * Updates event status
   */
  async updateStatus(eventId: string, status: EventStatus): Promise<void> {
    const eventRef = doc(this.eventsCollection, eventId);
    await updateDoc(eventRef, { status });
  }

  /**
   * Updates event details
   */
  async updateEvent(
    eventId: string,
    data: Partial<CreateEventData>
  ): Promise<void> {
    const eventRef = doc(this.eventsCollection, eventId);
    const updates: any = {};

    if (data.name) updates.name = data.name;
    if (data.minAmount !== undefined) updates.minAmount = data.minAmount;
    if (data.maxAmount !== undefined) updates.maxAmount = data.maxAmount;
    if (data.registrationDeadline) {
      updates.registrationDeadline = Timestamp.fromDate(
        new Date(data.registrationDeadline)
      );
    }

    await updateDoc(eventRef, updates);
  }

  /**
   * Toggles registration open/closed
   */
  async toggleRegistration(eventId: string, isOpen: boolean): Promise<void> {
    const eventRef = doc(this.eventsCollection, eventId);
    await updateDoc(eventRef, { isRegistrationOpen: isOpen });
  }

  private readonly MAX_RAFFLE_ATTEMPTS = 1000;

  /**
   * Runs the raffle algorithm
   * Uses "Shuffle and Verify" method to ensure no self-matches
   */
  async runRaffle(eventId: string): Promise<void> {
    // Get all participants
    const participantsRef = collection(
      firestore,
      `events/${eventId}/participants`
    );
    const participantsSnap = await getDocs(participantsRef);

    if (participantsSnap.empty || participantsSnap.size < 2) {
      throw new Error('Need at least 2 participants to run raffle');
    }

    const participants: Participant[] = participantsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Participant[];

    // Create receivers array and shuffle until no self-matches
    let receivers: Participant[];
    let attempts = 0;

    do {
      receivers = [...participants];
      this.shuffleArray(receivers);
      attempts++;

      if (attempts > this.MAX_RAFFLE_ATTEMPTS) {
        throw new Error(
          'Could not generate valid raffle after maximum attempts'
        );
      }
    } while (this.hasSelfMatch(participants, receivers));

    // Use batch writes to update all participants atomically
    const batch = writeBatch(firestore);

    participants.forEach((participant, index) => {
      const participantRef = doc(
        firestore,
        `events/${eventId}/participants`,
        participant.id
      );
      batch.update(participantRef, {
        assignedToId: receivers[index].id,
        assignedToName: receivers[index].name,
      });
    });

    await batch.commit();

    // Update event status to DRAWN
    await this.updateStatus(eventId, 'DRAWN');
  }

  /**
   * Assigns an owner to an event
   */
  async assignOwner(eventId: string, ownerId: string): Promise<void> {
    const eventRef = doc(this.eventsCollection, eventId);
    await updateDoc(eventRef, { ownerId });
  }

  /**
   * Verifies if the admin token is valid for an event
   */
  async verifyAdminToken(eventId: string, token: string): Promise<boolean> {
    const event = await this.getEvent(eventId);
    return event !== null && event.adminToken === token;
  }

  /**
   * Gets admin token from localStorage
   */
  getStoredAdminToken(eventId: string): string | null {
    return localStorage.getItem(`event_${eventId}_token`);
  }

  /**
   * Generates a random admin token using crypto API for security
   */
  private generateAdminToken(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Deletes an event
   */
  async deleteEvent(eventId: string): Promise<void> {
    const eventRef = doc(this.eventsCollection, eventId);
    await deleteDoc(eventRef);
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Checks if any participant is assigned to themselves
   */
  private hasSelfMatch(
    givers: Participant[],
    receivers: Participant[]
  ): boolean {
    return givers.some((giver, index) => giver.id === receivers[index].id);
  }
}
