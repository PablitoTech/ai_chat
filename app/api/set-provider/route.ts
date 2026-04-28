import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const { provider, model } = await request.json();

    const validProviders = ["deepseek", "openai", "anthropic"];
    if (provider && !validProviders.includes(provider)) {
      return NextResponse.json({ error: "Provider invalido" }, { status: 400 });
    }

    const response = NextResponse.json({ success: true, provider, model });

    const cookieOpts = {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 30,
    };

    if (provider) {
      response.cookies.set("ai_provider", provider, cookieOpts);
    }

    if (model) {
      const providerKey = provider || "deepseek";
      const providerConfig = config.providers[providerKey as keyof typeof config.providers];
      const validModels = providerConfig?.models.map((m) => m.id) || [];
      if (validModels.includes(model)) {
        response.cookies.set("ai_model", model, cookieOpts);
      }
    }

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
