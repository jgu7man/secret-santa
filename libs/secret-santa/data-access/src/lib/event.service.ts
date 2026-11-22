import { Injectable, inject } from '@angular/core';
import {
  CreateEventData,
  Event,
  EventStatus,
  Participant,
  eventSchema,
  generateRaffleAssignments,
  participantSchema,
} from '@secret-santa/domain';
import {
  Timestamp,
  UpdateData,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { FIRESTORE_DB } from '@secret-santa/shared-firebase';

/**
 * Shared Firestore service managing Secret Santa events, participant draws, and queries.
 */
@Injectable({
  providedIn: 'root',
})
export class EventService {
  private readonly db = inject(FIRESTORE_DB);
  private readonly eventsCollection = collection(this.db, 'events');

  /** Creates a new event and stores its generated admin token in localStorage. */
  async createEvent(
    data: CreateEventData,
    ownerId?: string
  ): Promise<{ eventId: string; adminToken: string }> {
    const adminToken = crypto.randomUUID();
    const eventRef = doc(this.eventsCollection);
    const eventId = eventRef.id;

    const newEvent: Omit<Event, 'id'> = {
      adminToken,
      name: data.name,
      minAmount: data.minAmount,
      ...(typeof data.maxAmount === 'number' ? { maxAmount: data.maxAmount } : {}),
      revealToHost: data.revealToHost,
      isRegistrationOpen: true,
      status: EventStatus.CREATED,
      createdAt: Timestamp.now(),
      ownerId: ownerId ?? null,
      ...(data.registrationDeadline
        ? {
            registrationDeadline: Timestamp.fromDate(
              new Date(data.registrationDeadline)
            ),
          }
        : {}),
    };

    await setDoc(eventRef, newEvent);
    localStorage.setItem(`event_${eventId}_token`, adminToken);

    return { eventId, adminToken };
  }

  /** Lists all events across the platform (used by backoffice analytics). */
  async getAllEvents(): Promise<Event[]> {
    const querySnapshot = await getDocs(this.eventsCollection);
    return querySnapshot.docs.map((eventDoc) =>
      eventSchema.parse({ ...eventDoc.data(), id: eventDoc.id })
    );
  }

  /** Lists events owned by a specific authenticated host UID. */
  async getEventsByOwner(ownerId: string): Promise<Event[]> {
    const q = query(this.eventsCollection, where('ownerId', '==', ownerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((eventDoc) =>
      eventSchema.parse({ ...eventDoc.data(), id: eventDoc.id })
    );
  }

  /** Lists all events where the given user UID is registered as a participant. */
  async getEventsByParticipant(uid: string): Promise<Event[]> {
    const q = query(
      this.eventsCollection,
      where('participantUids', 'array-contains', uid)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((eventDoc) =>
      eventSchema.parse({ ...eventDoc.data(), id: eventDoc.id })
    );
  }

  /** Fetches a single event by ID, returning null if not found. */
  async getEvent(eventId: string): Promise<Event | null> {
    const eventRef = doc(this.eventsCollection, eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
      return null;
    }

    return eventSchema.parse({
      ...eventSnap.data(),
      id: eventSnap.id,
    });
  }

  /** Updates an event lifecycle status (`CREATED` or `DRAWN`). */
  async updateStatus(eventId: string, status: EventStatus): Promise<void> {
    const eventRef = doc(this.eventsCollection, eventId);
    await updateDoc(eventRef, { status });
  }

  /** Updates mutable event details. */
  async updateEvent(
    eventId: string,
    data: Partial<CreateEventData>
  ): Promise<void> {
    const eventRef = doc(this.eventsCollection, eventId);
    const updates: UpdateData<Omit<Event, 'id'>> = {};

    if (data.name) {
      updates.name = data.name;
    }
    if (data.minAmount !== undefined) {
      updates.minAmount = data.minAmount;
    }
    if (typeof data.maxAmount === 'number') {
      updates.maxAmount = data.maxAmount;
    }
    if (data.registrationDeadline) {
      updates.registrationDeadline = Timestamp.fromDate(
        new Date(data.registrationDeadline)
      );
    }

    await updateDoc(eventRef, updates);
  }

  /** Opens or closes participant registration for an event. */
  async toggleRegistration(eventId: string, isOpen: boolean): Promise<void> {
    const eventRef = doc(this.eventsCollection, eventId);
    await updateDoc(eventRef, { isRegistrationOpen: isOpen });
  }

  /** Runs the Secret Santa shuffle-and-verify raffle algorithm atomically. */
  async runRaffle(eventId: string): Promise<void> {
    const participantsRef = collection(
      this.db,
      `events/${eventId}/participants`
    );
    const participantsSnap = await getDocs(participantsRef);

    if (participantsSnap.empty || participantsSnap.size < 2) {
      throw new Error('Need at least 2 participants to run raffle');
    }

    const participants: Participant[] = participantsSnap.docs.map(
      (participantDoc) =>
        participantSchema.parse({
          ...participantDoc.data(),
          id: participantDoc.id,
        })
    );

    const assignments = generateRaffleAssignments(participants);
    const batch = writeBatch(this.db);

    for (const assignment of assignments) {
      const participantRef = doc(
        this.db,
        `events/${eventId}/participants`,
        assignment.giverId
      );
      batch.update(participantRef, {
        assignedToId: assignment.receiverId,
        assignedToName: assignment.receiverName,
      });
    }

    await batch.commit();
    await this.updateStatus(eventId, EventStatus.DRAWN);
  }

  /** Assigns an authenticated host UID as owner of an event. */
  async assignOwner(eventId: string, ownerId: string): Promise<void> {
    const eventRef = doc(this.eventsCollection, eventId);
    await updateDoc(eventRef, { ownerId });
  }

  /** Verifies if the provided admin token matches the event's adminToken. */
  async verifyAdminToken(eventId: string, token: string): Promise<boolean> {
    const event = await this.getEvent(eventId);
    return event !== null && event.adminToken === token;
  }

  /** Reads a stored admin token from localStorage for a given event. */
  getStoredAdminToken(eventId: string): string | null {
    return localStorage.getItem(`event_${eventId}_token`);
  }

  /** Removes a participant and resets an already-drawn event back to `CREATED`. */
  async deleteParticipant(
    eventId: string,
    participantId: string
  ): Promise<void> {
    const participantRef = doc(
      this.db,
      `events/${eventId}/participants`,
      participantId
    );

    await deleteDoc(participantRef);

    const event = await this.getEvent(eventId);
    if (event && event.status === EventStatus.DRAWN) {
      await this.updateStatus(eventId, EventStatus.CREATED);
    }
  }

  /** Deletes an event document from Firestore. */
  async deleteEvent(eventId: string): Promise<void> {
    const eventRef = doc(this.eventsCollection, eventId);
    await deleteDoc(eventRef);
  }
}
