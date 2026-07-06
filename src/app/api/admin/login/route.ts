import { NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/auth";
import { setSession } from "@/lib/session";

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}));
  if (!username || !password) {
    return NextResponse.json({ error: "Логин мен құпия сөз керек" }, { status: 400 });
  }
  const user = await verifyCredentials(username, password);
  if (!user) {
    return NextResponse.json({ error: "Логин немесе құпия сөз қате" }, { status: 401 });
  }
  await setSession({ uid: user.id, username: user.username });
  return NextResponse.json({ ok: true });
}
