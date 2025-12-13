import { Timestamp } from 'firebase/firestore';

export type EventStatus = 'CREATED' | 'DRAWN';

export interface Event {
  id: string;
  adminToken: string;
  name: string;
  minAmount: number;
  maxAmount?: number;
  revealToHost: boolean;
  isRegistrationOpen: boolean;
  status: EventStatus;
  createdAt: Timestamp;
  ownerId?: string;
  registrationDeadline?: Timestamp;
}

export interface CreateEventData {
  name: string;
  minAmount: number;
  maxAmount?: number;
  revealToHost: boolean;
  registrationDeadline?: string; // ISO string from form
}
