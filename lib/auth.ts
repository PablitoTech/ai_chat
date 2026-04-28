import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface JwtPayload {
  userId: number;
  email: string;
  nombre: string;
  apellido: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.substring(7);
}

export function getUserFromRequest(request: NextRequest): JwtPayload | null {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function requireAuth(request: NextRequest): JwtPayload {
  const user = getUserFromRequest(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export function validarPassword(password: string): string | null {
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres";
  }
  if (!/[A-Z]/.test(password)) {
    return "La contraseña debe tener al menos una mayuscula";
  }
  if (!/[a-z]/.test(password)) {
    return "La contraseña debe tener al menos una minuscula";
  }
  if (!/[0-9]/.test(password)) {
    return "La contraseña debe tener al menos un numero";
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) {
    return "La contraseña debe tener al menos un caracter especial";
  }
  return null;
}
