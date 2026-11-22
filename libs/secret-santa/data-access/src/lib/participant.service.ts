import { Injectable, inject } from '@angular/core';
import {
  Participant,
  ParticipantLogin,
  ParticipantPreferences,
  ParticipantRegistration,
  buildNewParticipant,
  matchesSecretWord,
  normalizeParticipantName,
  participantPreferencesSchema,
  participantSchema,
} from '@secret-santa/domain';
import { FIRESTORE_DB } from '@secret-santa/shared-firebase';
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

/**
 * Shared Firestore service managing participant registrations, lookups, and preferences.
 */
@Injectable({
  providedIn: 'root',
})
export class ParticipantService {
  private readonly db = inject(FIRESTORE_DB);

  /** Checks whether a participant display name is available (case-insensitive) for an event. */
  async checkNameAvailability(eventId: string, name: string): Promise<boolean> {
    const normalizedName = normalizeParticipantName(name);
    const q = query(
      this.participantsCollection(eventId),
      where('normalizedName', '==', normalizedName)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.empty;
  }

  /** Registers a new participant in an event and stores their local session. */
  async register(
    eventId: string,
    data: ParticipantRegistration
  ): Promise<Participant> {
    const isAvailable = await this.checkNameAvailability(eventId, data.name);
    if (!isAvailable) {
      throw new Error(
        'This name is already taken. Please choose a different name.'
      );
    }

    const participantRef = doc(this.participantsCollection(eventId));
    const participant = buildNewParticipant(participantRef.id, data);
    const { id: _ignoredId, ...firestorePayload } = participant;

    await setDoc(participantRef, firestorePayload);

    if (data.uid) {
      const eventRef = doc(this.db, 'events', eventId);
      await updateDoc(eventRef, {
        participantUids: arrayUnion(data.uid),
      });
    }

    this.storeParticipantSession(eventId, participant.id);
    return participant;
  }

  /** Finds or links a participant using their Firebase Auth UID (or fallback email). */
  async loginWithUid(
    eventId: string,
    uid: string,
    email?: string | null
  ): Promise<Participant | null> {
    const participantsRef = this.participantsCollection(eventId);

    const uidSnap = await getDocs(query(participantsRef, where('uid', '==', uid)));
    if (!uidSnap.empty) {
      const participantDoc = uidSnap.docs[0];
      const participant = participantSchema.parse({
        ...participantDoc.data(),
        id: participantDoc.id,
      });
      this.storeParticipantSession(eventId, participant.id);
      return participant;
    }

    if (email) {
      const emailSnap = await getDocs(
        query(participantsRef, where('email', '==', email))
      );
      if (!emailSnap.empty) {
        const participantDoc = emailSnap.docs[0];
        await updateDoc(participantDoc.ref, { uid });
        await updateDoc(doc(this.db, 'events', eventId), {
          participantUids: arrayUnion(uid),
        });
        const participant = participantSchema.parse({
          ...participantDoc.data(),
          uid,
          id: participantDoc.id,
        });
        this.storeParticipantSession(eventId, participant.id);
        return participant;
      }
    }

    return null;
  }

  /** Authenticates a participant with normalized name and secret word. */
  async login(
    eventId: string,
    credentials: ParticipantLogin
  ): Promise<Participant | null> {
    const normalizedName = normalizeParticipantName(credentials.name);
    const q = query(
      this.participantsCollection(eventId),
      where('normalizedName', '==', normalizedName)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const participantDoc = querySnapshot.docs[0];
    const participant = participantSchema.parse({
      ...participantDoc.data(),
      id: participantDoc.id,
    });

    if (!matchesSecretWord(participant, credentials.secretWord)) {
      return null;
    }

    this.storeParticipantSession(eventId, participant.id);
    return participant;
  }

  /** Fetches a single participant by ID. */
  async getParticipant(
    eventId: string,
    participantId: string
  ): Promise<Participant | null> {
    const participantSnap = await getDoc(
      this.participantDocRef(eventId, participantId)
    );

    if (!participantSnap.exists()) {
      return null;
    }

    return participantSchema.parse({
      ...participantSnap.data(),
      id: participantSnap.id,
    });
  }

  /** Fetches all participants registered in an event. */
  async getParticipants(eventId: string): Promise<Participant[]> {
    const querySnapshot = await getDocs(this.participantsCollection(eventId));

    return querySnapshot.docs.map((participantDoc) =>
      participantSchema.parse({
        ...participantDoc.data(),
        id: participantDoc.id,
      })
    );
  }

  /** Updates a participant's gift preferences after validating against `participantPreferencesSchema`. */
  async updatePreferences(
    eventId: string,
    participantId: string,
    preferences: ParticipantPreferences
  ): Promise<void> {
    const validated = participantPreferencesSchema.parse(preferences);
    await updateDoc(this.participantDocRef(eventId, participantId), {
      preferences: validated,
    });
  }

  /** Resets a participant's secret word (used via admin-generated reset link). */
  async resetSecretWord(
    eventId: string,
    participantId: string,
    newSecretWord: string
  ): Promise<void> {
    await updateDoc(this.participantDocRef(eventId, participantId), {
      secretWord: newSecretWord,
    });
  }

  /** Fetches the participant assigned to receive a gift from the given participant. */
  async getAssignedParticipant(
    eventId: string,
    participantId: string
  ): Promise<Participant | null> {
    const participant = await this.getParticipant(eventId, participantId);

    if (!participant || !participant.assignedToId) {
      return null;
    }

    return this.getParticipant(eventId, participant.assignedToId);
  }

  /** Reads stored participant ID from localStorage. */
  getStoredParticipantId(eventId: string): string | null {
    return localStorage.getItem(this.sessionKey(eventId));
  }

  /** Clears stored participant session from localStorage. */
  clearParticipantSession(eventId: string): void {
    localStorage.removeItem(this.sessionKey(eventId));
  }

  private storeParticipantSession(eventId: string, participantId: string): void {
    localStorage.setItem(this.sessionKey(eventId), participantId);
  }

  private sessionKey(eventId: string): string {
    return `event_${eventId}_participant`;
  }

  private participantsCollection(eventId: string) {
    return collection(this.db, `events/${eventId}/participants`);
  }

  private participantDocRef(eventId: string, participantId: string) {
    return doc(this.db, `events/${eventId}/participants`, participantId);
  }
}
