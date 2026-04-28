"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Message as MessageType, Attachment, ConversationData } from "@/types";
import { Conversation, generarTitulo, createConversation, getMessages, saveMessage } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import Message from "./Message";
import Input from "./Input";
import Sidebar from "./Sidebar";
import ProviderSelector from "./ProviderSelector";
import ModelSelector from "./ModelSelector";

export default function Chat() {
  const { user, getAuthHeaders } = useAuth();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);
  const [activeProviderKey, setActiveProviderKey] = useState("deepseek");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ai_provider") || "deepseek";
    setActiveProviderKey(stored);
  }, []);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentConversation(null);
    setError(null);
  }, []);

  const handleSelectConversation = useCallback(async (conv: ConversationData) => {
    setError(null);
    const authHeaders = getAuthHeaders();
    const msgs = await getMessages(conv.id, authHeaders);
    setMessages(msgs);
    setCurrentConversation({
      id: conv.id,
      title: conv.title,
      messages: msgs,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    });
  }, [getAuthHeaders]);

  const handleSendMessage = async (messageText: string, attachments: Attachment[] = []) => {
    if ((!messageText.trim() && attachments.length === 0) || isLoading) return;

    setIsLoading(true);
    setError(null);

    let conversationId = currentConversation?.id;
    const conversationMessages = messages;
    const authHeaders = getAuthHeaders();

    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const updatedMessages = [...conversationMessages, userMessage];
    setMessages(updatedMessages);

    try {
      if (!conversationId) {
        const title = generarTitulo(updatedMessages);
        const newConv = await createConversation(title, authHeaders, {
          role: "user",
          content: messageText,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
        conversationId = newConv.id;
        setCurrentConversation(newConv);
        setSidebarRefresh((n) => n + 1);
      } else {
        await saveMessage(conversationId, {
          role: "user",
          content: messageText,
          attachments: attachments.length > 0 ? attachments : undefined,
        }, authHeaders);
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history: conversationMessages,
          attachments: attachments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener respuesta");
      }

      const assistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      if (conversationId) {
        await saveMessage(conversationId, {
          role: "assistant",
          content: data.content,
        }, authHeaders);
      }

      setCurrentConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: finalMessages,
              title: generarTitulo(finalMessages),
              updatedAt: new Date(),
            }
          : null
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);

      const errorAssistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Lo siento, ocurrio un error: ${errorMessage}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        currentConversationId={currentConversation?.id}
        refreshKey={sidebarRefresh}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-100">
                  {currentConversation?.title || "AI Chat"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ProviderSelector activeProvider={activeProviderKey} onProviderChange={setActiveProviderKey} />
              <ModelSelector activeProvider={activeProviderKey} />
            </div>
          </div>
        </header>

        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto px-4 py-6"
        >
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-100 mb-2">
                  Bienvenido a AI Chat
                </h2>
                <p className="text-gray-400 max-w-md mb-6">
                  Chatea con los mejores modelos de IA. Soporte para texto, imagenes, PDFs y mas.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                    Analisis de PDFs
                  </span>
                  <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                    Analisis de imagenes
                  </span>
                  <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                    Preguntas generales
                  </span>
                  <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                    Ayuda con codigo
                  </span>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <Message key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-sm text-gray-400">Escribiendo respuesta...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border-l-4 border-red-500 px-4 py-3 mx-4 mb-2 rounded-lg max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <p className="text-red-300 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300"
              >
                x
              </button>
            </div>
          </div>
        )}

        <Input onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
