export interface Attachment {
  id: string;
  type: "image" | "pdf";
  name: string;
  size: number;
  data: string;
  previewUrl?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
}

export interface ChatRequest {
  message: string;
  history?: Message[];
  attachments?: Attachment[];
}

export interface ChatResponse {
  content: string;
  error?: string;
}

export interface ConversationData {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messagesCount: number;
}

export interface AuthUser {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
}
