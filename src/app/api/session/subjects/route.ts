import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TEACHER_GRADE } from "@/lib/utils";

// Оқушының/мұғалімнің пәндер дашбордына арналған дерек.
// Оқушы: сыныбының барлық пәні. Мұғалім: кодына тіркелген пәндер ғана.
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

  const isTeacher = student.grade === TEACHER_GRADE;

  const subjects = await prisma.subject.findMany({
    where: isTeacher
      ? { id: { in: student.codes[0]?.subjectIds ?? [] } } // мұғалім: кодтағы пәндер
      : { grade: student.grade }, // оқушы: сынып пәндері
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
