import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shuffle } from "@/lib/utils";

// Оқушыға арналған тест — әрекетке (Attempt) бекітілген нақты 20 сұрақ.
// МАҢЫЗДЫ: дұрыс жауап кілті (correctKey) клиентке ЕШҚАШАН жіберілмейді.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const attemptId = searchParams.get("attemptId");
  if (!attemptId) {
    return NextResponse.json({ error: "attemptId керек" }, { status: 400 });
  }

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { subject: true },
  });
  if (!attempt) {
    return NextResponse.json({ error: "Тест сеансы табылмады" }, { status: 404 });
  }

  const questions = await prisma.question.findMany({
    where: { id: { in: attempt.questionIds } },
  });

  // Сұрақтарды да, нұсқаларды да араластырамыз
  const payload = shuffle(questions).map((q) => ({
    id: q.id,
    text: q.text,
    imageUrl: q.imageUrl,
    subjectName: attempt.subject.name,
    options: shuffle([
      { key: "A", text: q.optionA },
      { key: "B", text: q.optionB },
      { key: "C", text: q.optionC },
      { key: "D", text: q.optionD },
    ]),
  }));

  return NextResponse.json({ subjectName: attempt.subject.name, questions: payload });
}
