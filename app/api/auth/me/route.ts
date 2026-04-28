import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request);

    if (!payload) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        estado: true,
        fecha_creacion: true,
      },
    });

    if (!user || user.estado === "I") {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error en me:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
