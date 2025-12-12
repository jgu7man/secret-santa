import { Injectable } from '@angular/core';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query, 
  where,
  updateDoc
} from 'firebase/firestore';
import { firestore } from '../firebase-config';
import { Participant, ParticipantRegistration, ParticipantLogin } from '../models/participant.model';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {

  constructor() { }

  /**
   * Checks if a name is available (case-insensitive)
   */
  async checkNameAvailability(eventId: string, name: string): Promise<boolean> {
    const normalizedName = name.toLowerCase().trim();
    const participantsRef = collection(firestore, `events/${eventId}/participants`);
    const q = query(participantsRef, where('normalizedName', '==', normalizedName));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.empty;
  }

  /**
   * Registers a new participant
   */
  async register(eventId: string, data: ParticipantRegistration): Promise<Participant> {
    // Check name availability
    const isAvailable = await this.checkNameAvailability(eventId, data.name);
    if (!isAvailable) {
      throw new Error('This name is already taken. Please choose a different name.');
    }

    const participantsRef = collection(firestore, `events/${eventId}/participants`);
    const participantRef = doc(participantsRef);
    const participantId = participantRef.id;

    const newParticipant: Omit<Participant, 'id'> = {
      name: data.name.trim(),
      normalizedName: data.name.toLowerCase().trim(),
      secretWord: data.secretWord,
      email: data.email,
      preferences: {
        general: data.preferences?.general || '',
        sizes: data.preferences?.sizes || ''
      },
      assignedToId: null,
      assignedToName: null
    };

    await setDoc(participantRef, newParticipant);

    // Store participant session
    this.storeParticipantSession(eventId, participantId);

    return {
      id: participantId,
      ...newParticipant
    };
  }

  /**
   * Login a participant
   */
  async login(eventId: string, credentials: ParticipantLogin): Promise<Participant | null> {
    const normalizedName = credentials.name.toLowerCase().trim();
    const participantsRef = collection(firestore, `events/${eventId}/participants`);
    
    // Query by normalized name
    const q = query(participantsRef, where('normalizedName', '==', normalizedName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const participantDoc = querySnapshot.docs[0];
    const participant = {
      id: participantDoc.id,
      ...participantDoc.data()
    } as Participant;

    // Verify secret word
    if (participant.secretWord !== credentials.secretWord) {
      return null;
    }

    // Store participant session
    this.storeParticipantSession(eventId, participant.id);

    return participant;
  }

  /**
   * Gets a participant by ID
   */
  async getParticipant(eventId: string, participantId: string): Promise<Participant | null> {
    const participantRef = doc(firestore, `events/${eventId}/participants`, participantId);
    const participantSnap = await getDoc(participantRef);

    if (!participantSnap.exists()) {
      return null;
    }

    return {
      id: participantSnap.id,
      ...participantSnap.data()
    } as Participant;
  }

  /**
   * Gets all participants for an event
   */
  async getParticipants(eventId: string): Promise<Participant[]> {
    const participantsRef = collection(firestore, `events/${eventId}/participants`);
    const querySnapshot = await getDocs(participantsRef);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Participant[];
  }

  /**
   * Updates participant preferences
   */
  async updatePreferences(
    eventId: string, 
    participantId: string, 
    preferences: { general: string; sizes?: string }
  ): Promise<void> {
    const participantRef = doc(firestore, `events/${eventId}/participants`, participantId);
    await updateDoc(participantRef, { preferences });
  }

  /**
   * Resets a participant's secret word (admin only)
   */
  async resetSecretWord(eventId: string, participantId: string, newSecretWord: string): Promise<void> {
    const participantRef = doc(firestore, `events/${eventId}/participants`, participantId);
    await updateDoc(participantRef, { secretWord: newSecretWord });
  }

  /**
   * Gets the assigned participant (who this participant should gift to)
   */
  async getAssignedParticipant(eventId: string, participantId: string): Promise<Participant | null> {
    const participant = await this.getParticipant(eventId, participantId);
    
    if (!participant || !participant.assignedToId) {
      return null;
    }

    return this.getParticipant(eventId, participant.assignedToId);
  }

  /**
   * Stores participant session in localStorage
   * NOTE: For production apps with higher security requirements, consider:
   * - Using sessionStorage for auto-logout on browser close
   * - Implementing JWT tokens with expiration
   * - Using secure HTTP-only cookies
   */
  private storeParticipantSession(eventId: string, participantId: string): void {
    localStorage.setItem(`event_${eventId}_participant`, participantId);
  }

  /**
   * Gets stored participant ID from localStorage
   */
  getStoredParticipantId(eventId: string): string | null {
    return localStorage.getItem(`event_${eventId}_participant`);
  }

  /**
   * Clears participant session
   */
  clearParticipantSession(eventId: string): void {
    localStorage.removeItem(`event_${eventId}_participant`);
  }
}
