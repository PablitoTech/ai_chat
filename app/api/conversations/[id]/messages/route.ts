import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { Attachment } from "@/types";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const conversationId = parseInt(params.id);
    const conversacion = await prisma.conversacion.findUnique({
      where: { id: conversationId },
    });

    if (
      !conversacion ||
      conversacion.estado === "I" ||
      conversacion.usuario_id !== user.userId
    ) {
      return NextResponse.json(
        { error: "Conversacion no encontrada" },
        { status: 404 }
      );
    }

    const mensajes = await prisma.mensaje.findMany({
      where: { conversacion_id: conversationId, estado: "A" },
      orderBy: { fecha_creacion: "asc" },
      select: {
        id: true,
        rol: true,
        contenido: true,
        adjuntos: true,
        fecha_creacion: true,
      },
    });

    const result = mensajes.map((m) => ({
      id: m.id.toString(),
      role: m.rol,
      content: m.contenido,
      timestamp: m.fecha_creacion,
      attachments: m.adjuntos as unknown as Attachment[] | undefined,
    }));

    return NextResponse.json({ messages: result });
  } catch (error) {
    console.error("Error obteniendo mensajes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { role, content, attachments } = await request.json();

    if (!role || !content) {
      return NextResponse.json(
        { error: "Rol y contenido son requeridos" },
        { status: 400 }
      );
    }

    const conversationId = parseInt(params.id);
    const conversacion = await prisma.conversacion.findUnique({
      where: { id: conversationId },
    });

    if (
      !conversacion ||
      conversacion.estado === "I" ||
      conversacion.usuario_id !== user.userId
    ) {
      return NextResponse.json(
        { error: "Conversacion no encontrada" },
        { status: 404 }
      );
    }

    const mensaje = await prisma.mensaje.create({
      data: {
        conversacion_id: conversationId,
        rol: role,
        contenido: content,
        adjuntos: attachments || undefined,
        creado_por: user.email,
      },
    });

    await prisma.conversacion.update({
      where: { id: conversationId },
      data: {
        modificado_por: user.email,
        fecha_modificacion: new Date(),
      },
    });

    return NextResponse.json({
      message: {
        id: mensaje.id.toString(),
        role: mensaje.rol,
        content: mensaje.contenido,
        timestamp: mensaje.fecha_creacion,
        attachments: mensaje.adjuntos as unknown as Attachment[] | undefined,
      },
    });
  } catch (error) {
    console.error("Error creando mensaje:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
