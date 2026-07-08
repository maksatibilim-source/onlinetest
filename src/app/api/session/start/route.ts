import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GRADES, TEACHER_GRADE } from "@/lib/utils";

// Анкета: оқушыны/мұғалімді құрып, кодты соған байлаймыз.
// Код БЕЛСЕНДІ қалады (бірнеше пәнді тапсыру үшін), сессия соңында жарамсыз болады.
export async function POST(req: Request) {
  const { codeId, fullName, grade } = await req.json().catch(() => ({}));

  if (!codeId || !fullName?.trim()) {
    return NextResponse.json({ error: "Деректер толық емес" }, { status: 400 });
  }

  const code = await prisma.oneTimeCode.findUnique({ where: { id: codeId } });
  if (!code || code.status !== "active") {
    return NextResponse.json({ error: "Код жарамсыз немесе қолданылған" }, { status: 400 });
  }

  // Мұғалім коды болса — сынып 0 (Мұғалім); әйтпесе оқушы сыныбы (5–9).
  let studentGrade: number;
  if (code.grade === TEACHER_GRADE) {
    studentGrade = TEACHER_GRADE;
  } else {
    studentGrade = Number(grade);
    if (!GRADES.includes(studentGrade as never)) {
      return NextResponse.json({ error: "Сыныбыңызды таңдаңыз" }, { status: 400 });
    }
  }

  const student = await prisma.student.create({
    data: { fullName: fullName.trim(), grade: studentGrade },
  });

  await prisma.oneTimeCode.update({
    where: { id: code.id },
    data: { studentId: student.id },
  });

  return NextResponse.json({ ok: true, studentId: student.id });
}
