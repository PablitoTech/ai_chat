"use client";

interface Provider {
  id: string;
  name: string;
}

const providers: Provider[] = [
  { id: "deepseek", name: "DeepSeek" },
  { id: "openai", name: "OpenAI" },
  { id: "anthropic", name: "Anthropic" },
];

interface Props {
  activeProvider: string;
  onProviderChange: (provider: string) => void;
}

export default function ProviderSelector({ activeProvider, onProviderChange }: Props) {
  const updateProvider = async (providerId: string) => {
    if (providerId === activeProvider) return;

    localStorage.setItem("ai_provider", providerId);
    localStorage.removeItem("ai_model");
    onProviderChange(providerId);

    try {
      await fetch("/api/set-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId }),
      });
    } catch (error) {
      console.error("Error al cambiar proveedor:", error);
    }
  };

  const currentProviderData = providers.find((p) => p.id === activeProvider);

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-all">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span>{currentProviderData?.name || "Seleccionar"}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 rounded-xl shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="p-3 border-b border-gray-800">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Proveedor</p>
        </div>
        <div className="p-2">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => updateProvider(provider.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                activeProvider === provider.id
                  ? "bg-primary-900/30 border border-primary-700"
                  : "hover:bg-gray-800"
              }`}
            >
              <div className={`w-3 h-3 rounded-full border-2 ${
                activeProvider === provider.id ? "border-primary-500 bg-primary-500" : "border-gray-600"
              }`}>
                {activeProvider === provider.id && <div className="w-full h-full rounded-full bg-white scale-50" />}
              </div>
              <span className={`text-sm font-medium ${activeProvider === provider.id ? "text-primary-300" : "text-gray-200"}`}>
                {provider.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
