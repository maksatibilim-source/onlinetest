import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { getSession, type SessionPayload } from "./session";

// Логин/пароль тексеру (админ панельге кіру)
export async function verifyCredentials(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

// API route-та админ екенін тексеру. null болса — 401 қайтару керек.
export async function requireAdmin(): Promise<SessionPayload | null> {
  return getSession();
}
