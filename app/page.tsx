"use client";

import Chat from "@/components/Chat";
import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex gap-1">
          <span className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return <Chat />;
}
