export type MediaType =
  | 'image'
  | 'video'
  | 'audio'
  | 'sticker'
  | 'pdf'
  | 'text'
  | 'document'
  | 'other';

export interface ChatMessage {
  id: string;
  date: string;
  time: string;
  timestamp: number;
  sender: string | null;
  direction: 'in' | 'out';
  body: string;
  media: string | null;
  mediaUrl?: string;
  mediaType?: MediaType;
  omitted: boolean;
  deleted: boolean;
  system: boolean;
}

export interface Conversation {
  id: string;
  fileName: string;
  contactName: string;
  myName: string | null;
  isGroup: boolean;
  participants: string[];
  messages: ChatMessage[];
  messageCount?: number;
  mediaFiles: Record<string, string>; // filename -> blobUrl
  lastTimestamp: number;
  lastMessage: string;
  color: string;
  rawText?: string;
}

export type ProcessingStage = 'idle' | 'reading' | 'extracting' | 'parsing' | 'ready' | 'error';

export interface ProcessingState {
  stage: ProcessingStage;
  progress: number;
  message: string;
  totalFiles: number;
  processedFiles: number;
  chatCount: number;
  error?: string;
}

