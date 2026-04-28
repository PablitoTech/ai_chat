export interface ModelInfo {
  id: string;
  name: string;
  supportsImages: boolean;
  supportsPDF: boolean;
}

export interface AIProvider {
  name: string;
  baseUrl: string;
  model: string;
  models: ModelInfo[];
  apiKeyEnv: string;
}

export interface Config {
  providers: {
    deepseek: AIProvider;
    openai: AIProvider;
    anthropic: AIProvider;
  };
  defaultProvider: string;
}

export const config: Config = {
  providers: {
    deepseek: {
      name: "DeepSeek",
      baseUrl: "https://api.deepseek.com/chat/completions",
      model: "deepseek-v4-pro",
      models: [
        { id: "deepseek-v4-pro", name: "V4 Pro", supportsImages: false, supportsPDF: true },
        { id: "deepseek-v4-flash", name: "V4 Flash", supportsImages: false, supportsPDF: true },
      ],
      apiKeyEnv: "DEEPSEEK_API_KEY",
    },
    openai: {
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4o-mini",
      models: [
        { id: "gpt-4o-mini", name: "GPT-4o Mini", supportsImages: true, supportsPDF: true },
        { id: "gpt-4o", name: "GPT-4o", supportsImages: true, supportsPDF: true },
      ],
      apiKeyEnv: "OPENAI_API_KEY",
    },
    anthropic: {
      name: "Anthropic (Claude)",
      baseUrl: "https://api.anthropic.com/v1/messages",
      model: "claude-3-5-haiku-20241022",
      models: [
        { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", supportsImages: true, supportsPDF: true },
        { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", supportsImages: true, supportsPDF: true },
      ],
      apiKeyEnv: "ANTHROPIC_API_KEY",
    },
  },
  defaultProvider: "deepseek",
};

function getCookieValue(cookieHeader: string, key: string): string | null {
  const match = cookieHeader.match(new RegExp(`${key}=([^;]+)`));
  return match ? match[1] : null;
}

export function getActiveProvider(request?: Request): AIProvider {
  let providerKey = config.defaultProvider;
  let modelOverride: string | null = null;

  if (request) {
    const cookies = request.headers.get("cookie") || "";
    const cookieProvider = getCookieValue(cookies, "ai_provider");
    if (cookieProvider) providerKey = cookieProvider;
    modelOverride = getCookieValue(cookies, "ai_model");
  }

  const provider = config.providers[providerKey as keyof typeof config.providers];
  if (!provider) return config.providers.deepseek;

  return {
    ...provider,
    model: modelOverride || process.env.NEXT_PUBLIC_MODEL || provider.model,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || provider.baseUrl,
  };
}

export function getApiKey(): string | undefined {
  const provider = getActiveProvider();
  const key = process.env[provider.apiKeyEnv];
  if (key) return key;
  if (provider.name === "DeepSeek") return process.env.DEEPSEEK_API_KEY;
  if (provider.name === "OpenAI") return process.env.OPENAI_API_KEY;
  if (provider.name === "Anthropic (Claude)") return process.env.ANTHROPIC_API_KEY;
  return process.env.DEEPSEEK_API_KEY;
}
