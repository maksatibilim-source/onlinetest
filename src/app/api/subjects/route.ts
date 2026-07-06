import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { GRADES } from "@/lib/utils";

// Админ жаңа пән қосады және сыныпқа бекітеді
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Рұқсат жоқ" }, { status: 401 });

  const { name, grade } = await req.json().catch(() => ({}));
  if (!name?.trim() || !GRADES.includes(Number(grade) as never)) {
    return NextResponse.json({ error: "Пән атауы мен сынып керек" }, { status: 400 });
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
