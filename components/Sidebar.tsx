"use client";

import { useState, useEffect } from "react";
import { ConversationData } from "@/types";
import { getConversations, deleteConversation } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import Modal from "./Modal";

interface SidebarProps {
  onSelectConversation: (conversation: ConversationData) => void;
  onNewChat: () => void;
  currentConversationId?: number;
  refreshKey?: number;
}

export default function Sidebar({
  onSelectConversation,
  onNewChat,
  currentConversationId,
  refreshKey,
}: SidebarProps) {
  const { getAuthHeaders, logout, user } = useAuth();
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);

  const loadConversations = async () => {
    const authHeaders = getAuthHeaders();
    const convs = await getConversations(authHeaders);
    setConversations(convs);
  };

  useEffect(() => {
    loadConversations();
  }, [isOpen, refreshKey]);

  const handleDelete = async (e: React.MouseEvent, conv: ConversationData) => {
    e.stopPropagation();
    setDeleteTarget({ id: conv.id, title: conv.title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const authHeaders = getAuthHeaders();
    await deleteConversation(deleteTarget.id, authHeaders);
    await loadConversations();
    if (currentConversationId === deleteTarget.id) {
      onNewChat();
    }
    setDeleteTarget(null);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Hoy";
    if (days === 1) return "Ayer";
    if (days < 7) return `Hace ${days} dias`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  const initials = user ? (user.nombre[0] + user.apellido[0]).toUpperCase() : "";

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-gray-900 rounded-lg shadow-lg hover:bg-gray-800 transition-all md:hidden border border-gray-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      <div
        className={`fixed inset-y-0 left-0 z-40 bg-gray-900 border-r border-gray-800 transform transition-all duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static ${
          isCollapsed ? "w-[72px]" : "w-72"
        }`}
      >
        <div className={`p-4 border-b border-gray-800 ${isCollapsed ? "flex flex-col items-center gap-3" : ""}`}>
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-end"}`}>
            <div className={`${!isCollapsed ? "flex-1" : ""}`} />
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-all"
              title={isCollapsed ? "Expandir" : "Colapsar"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
            </button>
          </div>

          {!isCollapsed && (
            <button
              onClick={() => {
                onNewChat();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-medium text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Chat
            </button>
          )}
          {isCollapsed && (
            <button
              onClick={() => {
                onNewChat();
                setIsOpen(false);
              }}
              className="p-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
              title="Nuevo Chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {!isCollapsed && (
            <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Historial
            </h3>
          )}

          {conversations.length === 0 && !isCollapsed && (
            <p className="px-3 py-4 text-sm text-gray-500 text-center">
              No hay conversaciones guardadas
            </p>
          )}

          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv);
                  setIsOpen(false);
                }}
                className={`group relative rounded-lg cursor-pointer transition-all ${
                  isCollapsed ? "px-0 py-2 flex justify-center" : "px-3 py-2.5"
                } ${
                  currentConversationId === conv.id
                    ? "bg-primary-900/30 border border-primary-700"
                    : "hover:bg-gray-800"
                }`}
                title={isCollapsed ? conv.title : undefined}
              >
                {isCollapsed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${currentConversationId === conv.id ? "text-primary-400" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 flex-shrink-0 mt-0.5 ${currentConversationId === conv.id ? "text-primary-400" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${currentConversationId === conv.id ? "text-primary-300" : "text-gray-200"}`}>
                          {conv.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(conv.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, conv)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/30 rounded opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={`border-t border-gray-800 ${isCollapsed ? "p-3" : "p-4"}`}>
          {user && (
            <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {initials}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {user.nombre} {user.apellido}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              )}
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={logout}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesion
            </button>
          )}
          {isCollapsed && (
            <button
              onClick={logout}
              className="w-full mt-2 flex justify-center py-1.5 text-gray-400 hover:text-red-400 rounded-lg transition-all"
              title="Cerrar sesion"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Eliminar conversacion"
        confirmText="Eliminar"
        cancelText="Cancelar"
      >
        Estas seguro de eliminar <strong>{deleteTarget?.title}</strong>?
        <br />
        La conversacion se inactivara, no se borrara de la base de datos.
      </Modal>
    </>
  );
}
