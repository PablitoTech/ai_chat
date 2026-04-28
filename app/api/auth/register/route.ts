import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, validarPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { nombre, apellido, email, fecha_nacimiento, password } = await request.json();

    if (!nombre || !apellido || !email || !fecha_nacimiento || !password) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const passwordError = validarPassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email invalido" }, { status: 400 });
    }

    const fecha = new Date(fecha_nacimiento);
    if (isNaN(fecha.getTime())) {
      return NextResponse.json(
        { error: "Fecha de nacimiento invalida" },
        { status: 400 }
      );
    }

    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "El email ya esta registrado" },
        { status: 409 }
      );
    }

    const password_hash = await hashPassword(password);

    const user = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email,
        fecha_nacimiento: fecha,
        password_hash,
        creado_por: email,
      },
      select: { id: true, nombre: true, apellido: true, email: true },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
    });

    return NextResponse.json({ token, user });
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
