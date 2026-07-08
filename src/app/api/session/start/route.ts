import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GRADES } from "@/lib/utils";

// Анкета: оқушыны құрып, кодты соған байлаймыз (код әлі БЕЛСЕНДІ қалады —
// оқушы бірнеше пәнді тапсыра алуы үшін). Код сессия соңында жарамсыз болады.
export async function POST(req: Request) {
  const { codeId, fullName, grade } = await req.json().catch(() => ({}));

  if (!codeId || !fullName?.trim() || !GRADES.includes(Number(grade) as never)) {
    return NextResponse.json({ error: "Деректер толық емес" }, { status: 400 });
  }

  const code = await prisma.oneTimeCode.findUnique({ where: { id: codeId } });
  if (!code || code.status !== "active") {
    return NextResponse.json({ error: "Код жарамсыз немесе қолданылған" }, { status: 400 });
  }

  const student = await prisma.student.create({
    data: { fullName: fullName.trim(), grade: Number(grade) },
  });

  await prisma.oneTimeCode.update({
    where: { id: code.id },
    data: { studentId: student.id },
  });

  return NextResponse.json({ ok: true, studentId: student.id });
}
