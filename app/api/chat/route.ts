import { NextRequest, NextResponse } from "next/server";
import { ChatRequest, ChatResponse, Message, Attachment } from "@/types";
import { getActiveProvider, getApiKey } from "@/lib/config";

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [], attachments = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "El mensaje es requerido", content: "" },
        { status: 400 }
      );
    }

    const provider = getActiveProvider(request as unknown as Request);
    const apiKey = getApiKey();

    if (!apiKey) {
      console.error(`API key no configurada para ${provider.name}`);
      return NextResponse.json(
        { error: `API key no configurada para ${provider.name}`, content: "" },
        { status: 500 }
      );
    }

    const messages: any[] = [];

    if (history.length > 0) {
      history.forEach((msg: Message) => {
        let content = msg.content;
        
        if (msg.attachments && msg.attachments.length > 0) {
          const pdfAttachments = msg.attachments.filter((att) => att.type === "pdf");
          const imageAttachments = msg.attachments.filter((att) => att.type === "image");
          
          if (pdfAttachments.length > 0) {
            content += "\n\n" + formatPDFAttachments(pdfAttachments);
          }
          
          if (imageAttachments.length > 0) {
            content += "\n\n" + formatImageAttachments(imageAttachments, provider.name);
          }
        }
        
        messages.push({
          role: msg.role,
          content: content,
        });
      });
    }

    let finalMessage = message;
    const pdfAttachments = attachments.filter((att) => att.type === "pdf");
    const imageAttachments = attachments.filter((att) => att.type === "image");
    
    if (pdfAttachments.length > 0) {
      finalMessage += "\n\n" + formatPDFAttachments(pdfAttachments);
    }
    
    if (imageAttachments.length > 0) {
      finalMessage += "\n\n" + formatImageAttachments(imageAttachments, provider.name);
    }

    const requestBody = buildRequestBody(provider, finalMessage, messages, imageAttachments);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (provider.name === "Anthropic (Claude)") {
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(provider.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error de ${provider.name} API:`, response.status, errorData);
      return NextResponse.json(
        { 
          error: `Error de ${provider.name}: ${response.status} - ${errorData.error?.message || errorData.error?.type || "Error desconocido"}`, 
          content: "" 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = extractContent(data, provider.name);

    if (!content) {
      console.error("Respuesta inesperada:", data);
      return NextResponse.json(
        { error: "Respuesta inválida de la API", content: "" },
        { status: 500 }
      );
    }

    return NextResponse.json({ content });

  } catch (error) {
    console.error("Error en el handler de chat:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Error interno del servidor", 
        content: "" 
      },
      { status: 500 }
    );
  }
}

function buildRequestBody(
  provider: { name: string; model: string; baseUrl: string; apiKeyEnv: string },
  message: string,
  history: any[],
  imageAttachments: Attachment[]
): any {
  const providerName = provider.name;
  const model = provider.model;
  const hasImages = imageAttachments.length > 0;

  if (providerName === "OpenAI") {
    const content: any[] = [{ type: "text", text: message }];
    
    imageAttachments.forEach((att) => {
      content.push({
        type: "image_url",
        image_url: {
          url: att.data,
          detail: "high",
        },
      });
    });

    return {
      model,
      messages: [...history, { role: "user", content }],
      max_tokens: 4096,
    };
  }

  if (providerName === "Anthropic (Claude)") {
    const content: any[] = [{ type: "text", text: message }];
    
    imageAttachments.forEach((att) => {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: att.name.endsWith(".png") ? "image/png" : "image/jpeg",
          data: att.data.split(",")[1],
        },
      });
    });

    return {
      model,
      messages: [...history.filter((m) => m.role !== "system"), { role: "user", content }],
      max_tokens: 1024,
    };
  }

  return {
    model,
    messages: [...history, { role: "user", content: message }],
  };
}

function extractContent(data: any, providerName: string): string | null {
  if (providerName === "Anthropic (Claude)") {
    return data.content?.[0]?.text || null;
  }
  return data.choices?.[0]?.message?.content || null;
}

function formatPDFAttachments(attachments: Attachment[]): string {
  let formatted = "";
  attachments.forEach((att, index) => {
    formatted += `\n--- PDF ${index + 1}: ${att.name} ---\n${att.data}`;
  });
  return formatted;
}

function formatImageAttachments(attachments: Attachment[], providerName: string): string {
  if (providerName === "OpenAI" || providerName === "Anthropic (Claude)") {
    return "";
  }
  let formatted = "";
  attachments.forEach((att, index) => {
    formatted += `\n--- Imagen ${index + 1}: ${att.name} ---\n[Archivo de imagen adjunta]`;
  });
  return formatted;
}
