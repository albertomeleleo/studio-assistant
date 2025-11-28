export enum StreamState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  isFinal: boolean; // For streaming transcription updates
}

export interface Suggestion {
  id: string;
  text: string;
  type: 'question' | 'fact' | 'suggestion';
  timestamp: number;
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
}

export interface PcmBlob {
  data: string; // Base64
  mimeType: string;
}