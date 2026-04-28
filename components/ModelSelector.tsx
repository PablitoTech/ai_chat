"use client";

import { useState, useEffect } from "react";
import { config, ModelInfo } from "@/lib/config";

interface Props {
  activeProvider: string;
}

export default function ModelSelector({ activeProvider }: Props) {
  const [activeModel, setActiveModel] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("ai_model") || "";
    setActiveModel(stored);
  }, [activeProvider]);

  const provider = config.providers[activeProvider as keyof typeof config.providers];
  const models = provider?.models || [];
  const currentModelId = activeModel || provider?.model || "";
  const currentModel = models.find((m) => m.id === currentModelId);

  const selectModel = async (model: ModelInfo) => {
    localStorage.setItem("ai_model", model.id);
    setActiveModel(model.id);

    try {
      await fetch("/api/set-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: activeProvider, model: model.id }),
      });
    } catch (error) {
      console.error("Error al cambiar modelo:", error);
    }
  };

  if (models.length <= 1) return null;

  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-all border border-gray-700">
        <span className="max-w-[100px] truncate">{currentModel?.name || currentModelId}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="absolute right-0 top-full mt-1 w-52 bg-gray-900 rounded-xl shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="p-1.5">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => selectModel(model)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                currentModelId === model.id
                  ? "bg-primary-900/30 border border-primary-700"
                  : "hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm ${currentModelId === model.id ? "text-primary-300" : "text-gray-200"}`}>
                  {model.name}
                </span>
                <div className="flex gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    model.supportsImages ? "bg-green-900/50 text-green-400" : "bg-gray-800 text-gray-600"
                  }`}>
                    Img
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    model.supportsPDF ? "bg-blue-900/50 text-blue-400" : "bg-gray-800 text-gray-600"
                  }`}>
                    PDF
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
