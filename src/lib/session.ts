import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "ot_admin_session";
const MAX_AGE = 60 * 60 * 8; // 8 сағат

function getSecret(): string {
  return process.env.SESSION_SECRET ?? "dev-insecure-secret-change-me";
}

export interface SessionPayload {
  uid: string;
  username: string;
  exp: number; // unix секунд
}

function sign(data: string): string {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function createToken(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = sign(body);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString()
    ) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // мерзімі өткен
    return payload;
  } catch {
    return null;
  }
}

export async function setSession(data: Omit<SessionPayload, "exp">): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const token = createToken({ ...data, exp });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
