import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { generarTitulo } from "@/lib/storage";

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

    const conversacion = await prisma.conversacion.findUnique({
      where: { id: parseInt(params.id) },
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

    return NextResponse.json({
      conversation: {
        id: conversacion.id,
        title: conversacion.titulo,
        createdAt: conversacion.fecha_creacion,
        updatedAt: conversacion.fecha_modificacion || conversacion.fecha_creacion,
      },
    });
  } catch (error) {
    console.error("Error obteniendo conversacion:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { title } = await request.json();

    const conversacion = await prisma.conversacion.findUnique({
      where: { id: parseInt(params.id) },
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

    const updated = await prisma.conversacion.update({
      where: { id: parseInt(params.id) },
      data: {
        titulo: title || conversacion.titulo,
        modificado_por: user.email,
        fecha_modificacion: new Date(),
      },
    });

    return NextResponse.json({
      conversation: {
        id: updated.id,
        title: updated.titulo,
        createdAt: updated.fecha_creacion,
        updatedAt: updated.fecha_modificacion || updated.fecha_creacion,
      },
    });
  } catch (error) {
    console.error("Error actualizando conversacion:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const conversacion = await prisma.conversacion.findUnique({
      where: { id: parseInt(params.id) },
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

    await prisma.$transaction([
      prisma.conversacion.update({
        where: { id: parseInt(params.id) },
        data: {
          estado: "I",
          modificado_por: user.email,
          fecha_modificacion: new Date(),
        },
      }),
      prisma.mensaje.updateMany({
        where: { conversacion_id: parseInt(params.id) },
        data: {
          estado: "I",
          modificado_por: user.email,
          fecha_modificacion: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando conversacion:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
