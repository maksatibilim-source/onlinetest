import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface IncomingAnswer {
  questionId: string;
  selectedKey: string | null;
}

// Тестті аяқтау: жауаптарды бағалау + кодты жарамсыз ету
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { answers, violations } = (await req.json().catch(() => ({}))) as {
    answers?: IncomingAnswer[];
    violations?: number;
  };

  const attempt = await prisma.attempt.findUnique({ where: { id } });
  if (!attempt) {
    return NextResponse.json({ error: "Тест сеансы табылмады" }, { status: 404 });
  }
  // Қайта тапсыруды болдырмау (идемпотентті)
  if (attempt.status === "finished") {
    return NextResponse.json({ ok: true, score: attempt.score, total: attempt.totalQuestions });
  }

  const incoming = Array.isArray(answers) ? answers : [];
  const questionIds = incoming.map((a) => a.questionId);

  // Дұрыс кілттерді сервер жағында аламыз (клиентке ешқашан жіберілмеген)
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  });
  const qMap = new Map(questions.map((q) => [q.id, q]));

  let score = 0;
  const answerData = incoming
    .filter((a) => qMap.has(a.questionId))
    .map((a) => {
      const q = qMap.get(a.questionId)!;
      const isCorrect = a.selectedKey === q.correctKey;
      if (isCorrect) score += 1;
      return {
        attemptId: id,
        questionId: a.questionId,
        selectedKey: a.selectedKey ?? null,
        isCorrect,
      };
    });

  const finalViolations =
    typeof violations === "number"
      ? Math.max(attempt.violations, violations)
      : attempt.violations;

  await prisma.$transaction(async (tx) => {
    // Қайта тапсыру болса — ескі жауаптарды тазарту
    await tx.answer.deleteMany({ where: { attemptId: id } });
    if (answerData.length) {
      await tx.answer.createMany({ data: answerData });
    }
    await tx.attempt.update({
      where: { id },
      data: {
        score,
        totalQuestions: answerData.length,
        violations: finalViolations,
        status: "finished",
        finishedAt: new Date(),
      },
    });
    // Кодты жарамсыз ету — қайта қолдануға тыйым
    if (attempt.codeId) {
      await tx.oneTimeCode.update({
        where: { id: attempt.codeId },
        data: { status: "used", usedAt: new Date() },
      });
    }
  });

  return NextResponse.json({ ok: true, score, total: answerData.length });
}
