import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { QUESTIONS_PER_SUBJECT, shuffle } from "@/lib/utils";

// Оқушы белгілі бір ПӘНДІ тапсыруды бастайды.
// Осы пәннен кездейсоқ 20 сұрақ таңдалып, әрекетке (Attempt) бекітіледі.
export async function POST(req: Request) {
  const { studentId, subjectId } = await req.json().catch(() => ({}));
  if (!studentId || !subjectId) {
    return NextResponse.json({ error: "Деректер толық емес" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { codes: true },
  });
  if (!student) {
    return NextResponse.json({ error: "Оқушы табылмады" }, { status: 404 });
  }

  const activeCode = student.codes.find((c) => c.status === "active");
  if (!activeCode) {
    return NextResponse.json({ error: "Сессия аяқталған" }, { status: 400 });
  }

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject || subject.grade !== student.grade) {
    return NextResponse.json({ error: "Пән табылмады" }, { status: 400 });
  }

  // Бұл пәнге бұрын әрекет бар ма?
  const existing = await prisma.attempt.findUnique({
    where: { studentId_subjectId: { studentId, subjectId } },
  });
  if (existing) {
    if (existing.status === "finished") {
      return NextResponse.json({ error: "Бұл пән тапсырылып қойған" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, attemptId: existing.id }); // жалғастыру
  }

  // Кездейсоқ 20 сұрақ таңдау (немесе бары аз болса — барлығы)
  const all = await prisma.question.findMany({
    where: { subjectId },
    select: { id: true },
  });
  if (all.length === 0) {
    return NextResponse.json({ error: "Бұл пәнде сұрақ жоқ" }, { status: 400 });
  }
  const selected = shuffle(all.map((q) => q.id)).slice(0, QUESTIONS_PER_SUBJECT);

  const attempt = await prisma.attempt.create({
    data: {
      studentId,
      subjectId,
      codeId: activeCode.id,
      questionIds: selected,
      totalQuestions: selected.length,
    },
  });

  return NextResponse.json({ ok: true, attemptId: attempt.id });
}
