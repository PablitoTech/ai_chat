import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const conversaciones = await prisma.conversacion.findMany({
      where: { usuario_id: user.userId, estado: "A" },
      select: {
        id: true,
        titulo: true,
        usuario_id: true,
        estado: true,
        fecha_creacion: true,
        fecha_modificacion: true,
        _count: { select: { mensajes: true } },
      },
      orderBy: { fecha_modificacion: "desc" },
    });

    const result = conversaciones.map((c) => ({
      id: c.id,
      title: c.titulo,
      usuario_id: c.usuario_id,
      estado: c.estado,
      createdAt: c.fecha_creacion,
      updatedAt: c.fecha_modificacion || c.fecha_creacion,
      messagesCount: c._count.mensajes,
    }));

    return NextResponse.json({ conversations: result });
  } catch (error) {
    console.error("Error obteniendo conversaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { title, initialMessage } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Titulo requerido" }, { status: 400 });
    }

    const conversacion = await prisma.conversacion.create({
      data: {
        usuario_id: user.userId,
        titulo: title,
        creado_por: user.email,
        estado: "A",
      },
    });

    if (initialMessage) {
      await prisma.mensaje.create({
        data: {
          conversacion_id: conversacion.id,
          rol: initialMessage.role,
          contenido: initialMessage.content,
          adjuntos: initialMessage.attachments || undefined,
          creado_por: user.email,
        },
      });
    }

    return NextResponse.json({
      conversation: {
        id: conversacion.id,
        title: conversacion.titulo,
        createdAt: conversacion.fecha_creacion,
        updatedAt: conversacion.fecha_modificacion || conversacion.fecha_creacion,
      },
    });
  } catch (error) {
    console.error("Error creando conversacion:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
