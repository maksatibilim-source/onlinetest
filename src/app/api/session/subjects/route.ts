import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Оқушының пәндер дашбордына арналған дерек:
// сыныбының пәндері + әр пәннің тапсыру статусы (аяқталды / жалғасуда / жоқ).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json({ error: "studentId керек" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { attempts: true, codes: true },
  });
  if (!student) {
    return NextResponse.json({ error: "Оқушы табылмады" }, { status: 404 });
  }

  const subjects = await prisma.subject.findMany({
    where: { grade: student.grade },
    orderBy: { name: "asc" },
    include: { _count: { select: { questions: true } } },
  });

  const attemptBySubject = new Map(student.attempts.map((a) => [a.subjectId, a]));
  const sessionActive = student.codes.some((c) => c.status === "active");

  const payload = subjects.map((s) => {
    const a = attemptBySubject.get(s.id);
    return {
      id: s.id,
      name: s.name,
      questionCount: s._count.questions,
      attempt: a
        ? { id: a.id, status: a.status, score: a.score, totalQuestions: a.totalQuestions }
        : null,
    };
  });

  return NextResponse.json({
    studentName: student.fullName,
    grade: student.grade,
    sessionActive,
    subjects: payload,
  });
}
