import { Message, ConversationData } from "@/types";

export interface Conversation {
  id: number;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export function generarTitulo(messages: Message[]): string {
  if (messages.length === 0) return "Nueva conversacion";
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (!firstUserMessage) return "Nueva conversacion";
  const content = firstUserMessage.content;
  if (content.length <= 30) return content;
  return content.substring(0, 30) + "...";
}

const API_BASE = "/api/conversations";

export async function getConversations(
  authHeaders: { Authorization?: string }
): Promise<ConversationData[]> {
  const res = await fetch(API_BASE, { headers: authHeaders });
  if (!res.ok) return [];
  const data = await res.json();
  return data.conversations.map((c: any) => ({
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
  }));
}

export async function createConversation(
  title: string,
  authHeaders: { Authorization?: string },
  initialMessage?: { role: string; content: string; attachments?: any[] }
): Promise<Conversation> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ title, initialMessage }),
  });
  const data = await res.json();
  if (!res.ok || !data.conversation) {
    throw new Error(data.error || "Error al crear la conversacion");
  }
  return {
    id: data.conversation.id,
    title: data.conversation.title,
    messages: [],
    createdAt: new Date(data.conversation.createdAt),
    updatedAt: new Date(data.conversation.updatedAt),
  };
}

export async function deleteConversation(
  id: number,
  authHeaders: { Authorization?: string }
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  return res.ok;
}

export async function updateConversationTitle(
  id: number,
  title: string,
  authHeaders: { Authorization?: string }
): Promise<ConversationData | null> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    id: data.conversation.id,
    title: data.conversation.title,
    createdAt: new Date(data.conversation.createdAt),
    updatedAt: new Date(data.conversation.updatedAt),
    messagesCount: 0,
  };
}

export async function getMessages(
  conversationId: number,
  authHeaders: { Authorization?: string }
): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/${conversationId}/messages`, {
    headers: authHeaders,
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.messages.map((m: any) => ({
    ...m,
    timestamp: new Date(m.timestamp),
  }));
}

export async function saveMessage(
  conversationId: number,
  message: { role: string; content: string; attachments?: any[] },
  authHeaders: { Authorization?: string }
): Promise<Message> {
  const res = await fetch(`${API_BASE}/${conversationId}/messages`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  const data = await res.json();
  if (!res.ok || !data.message) {
    console.error("Error al guardar mensaje:", data.error);
  }
  return {
    ...data.message,
    timestamp: data.message ? new Date(data.message.timestamp) : new Date(),
  };
}
