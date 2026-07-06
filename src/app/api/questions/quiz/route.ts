import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shuffle } from "@/lib/utils";

// Оқушыға арналған рандомизацияланған тест.
// МАҢЫЗДЫ: дұрыс жауап кілті (correctKey) клиентке ЕШҚАШАН жіберілмейді.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const attemptId = searchParams.get("attemptId");
  if (!attemptId) {
    return NextResponse.json({ error: "attemptId керек" }, { status: 400 });
  }

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { student: true },
  });
  if (!attempt) {
    return NextResponse.json({ error: "Тест сеансы табылмады" }, { status: 404 });
  }

  const grade = attempt.student.grade;

  // Оқушының сыныбына тиесілі барлық пәндердің сұрақтары
  const questions = await prisma.question.findMany({
    where: { subject: { grade } },
    include: { subject: true },
  });

  // Сұрақтарды да, әр сұрақтың нұсқаларын да араластырамыз
  const payload = shuffle(questions).map((q) => ({
    id: q.id,
    text: q.text,
    imageUrl: q.imageUrl,
    subjectName: q.subject.name,
    options: shuffle([
      { key: "A", text: q.optionA },
      { key: "B", text: q.optionB },
      { key: "C", text: q.optionC },
      { key: "D", text: q.optionD },
    ]),
  }));

  return NextResponse.json({ grade, questions: payload });
}
