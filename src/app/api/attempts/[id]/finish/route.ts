import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface IncomingAnswer {
  questionId: string;
  selectedKey: string | null;
}

// Бір пән тестін аяқтау: жауаптарды бағалау. Барлық пән аяқталса — кодты жарамсыз ету.
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
  if (attempt.status === "finished") {
    return NextResponse.json({ ok: true, score: attempt.score, total: attempt.totalQuestions });
  }

  // Тек осы әрекетке бекітілген сұрақтарды бағалаймыз (клиент жіберген артықты елемейміз)
  const incoming = Array.isArray(answers) ? answers : [];
  const answerMap = new Map(incoming.map((a) => [a.questionId, a.selectedKey ?? null]));

  const questions = await prisma.question.findMany({
    where: { id: { in: attempt.questionIds } },
  });
  const qMap = new Map(questions.map((q) => [q.id, q]));

  let score = 0;
  const answerData = attempt.questionIds
    .filter((qid) => qMap.has(qid))
    .map((qid) => {
      const q = qMap.get(qid)!;
      const selectedKey = answerMap.get(qid) ?? null;
      const isCorrect = selectedKey === q.correctKey;
      if (isCorrect) score += 1;
      return { attemptId: id, questionId: qid, selectedKey, isCorrect };
    });

  const finalViolations =
    typeof violations === "number"
      ? Math.max(attempt.violations, violations)
      : attempt.violations;

  await prisma.$transaction(async (tx) => {
    await tx.answer.deleteMany({ where: { attemptId: id } });
    if (answerData.length) await tx.answer.createMany({ data: answerData });
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
  });

  // Оқушы осы сыныптағы (сұрағы бар) барлық пәнді аяқтады ма? Аяқтаса — кодты жарамсыз ету.
  let allDone = false;
  const student = await prisma.student.findUnique({ where: { id: attempt.studentId } });
  if (student) {
    const subjectsWithQuestions = await prisma.subject.findMany({
      where: { grade: student.grade, questions: { some: {} } },
      select: { id: true },
    });
    const finished = await prisma.attempt.findMany({
      where: { studentId: student.id, status: "finished" },
      select: { subjectId: true },
    });
    const finishedSet = new Set(finished.map((a) => a.subjectId));
    allDone =
      subjectsWithQuestions.length > 0 &&
      subjectsWithQuestions.every((s) => finishedSet.has(s.id));

    if (allDone && attempt.codeId) {
      await prisma.oneTimeCode.update({
        where: { id: attempt.codeId },
        data: { status: "used", usedAt: new Date() },
      });
    }
  }

  return NextResponse.json({ ok: true, score, total: answerData.length, allDone });
}
