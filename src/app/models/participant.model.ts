export interface Participant {
  id: string;
  uid?: string;
  name: string;
  normalizedName: string;
  secretWord?: string;
  email?: string;
  preferences: {
    general: string;
    sizes?: string;
  };
  assignedToId: string | null;
  assignedToName: string | null;
}

export interface ParticipantRegistration {
  uid?: string;
  name: string;
  secretWord?: string;
  email?: string;
  preferences?: {
    general?: string;
    sizes?: string;
  };
}

export interface ParticipantLogin {
  name: string;
  secretWord: string;
}
