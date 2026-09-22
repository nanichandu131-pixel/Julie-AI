export interface FileAttachment {
  id: string;
  name: string;
  type: string; // MIME type e.g. 'image/png', 'application/pdf', 'text/plain'
  size: number;
  dataUrl?: string; // Base64 data url for images or thumbnails
  textContent?: string; // Extracted text if text/code/markdown/csv file
  isImage?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  error?: boolean;
  errorMessage?: string;
  isStreaming?: boolean;
  feedback?: 'positive' | 'negative';
  isCreatorCard?: boolean;
  attachments?: FileAttachment[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export type ThemeMode = 'dark' | 'light';

export interface ExamplePrompt {
  id: string;
  title: string;
  prompt: string;
  iconName: 'Code' | 'Sparkles' | 'Lightbulb' | 'Compass';
}
