import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { LEVELS } from "@/lib/utils";

// Админ жаңа пән қосады және деңгейге (5–9 сынып не Мұғалім) бекітеді
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Рұқсат жоқ" }, { status: 401 });

  const { name, grade } = await req.json().catch(() => ({}));
  if (!name?.trim() || !LEVELS.includes(Number(grade) as never)) {
    return NextResponse.json({ error: "Пән атауы мен деңгей керек" }, { status: 400 });
  }

  try {
    const subject = await prisma.subject.create({
      data: { name: name.trim(), grade: Number(grade) },
    });
    return NextResponse.json({ ok: true, subject });
  } catch {
    return NextResponse.json(
      { error: "Бұл сыныпта мұндай пән бұрыннан бар" },
      { status: 409 }
    );
  }
}
