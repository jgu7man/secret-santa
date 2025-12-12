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
}

export interface CreateEventData {
  name: string;
  minAmount: number;
  maxAmount?: number;
  revealToHost: boolean;
}
