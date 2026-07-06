import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseQuestions } from "@/lib/parseQuestions";

// .tex / мәтін мазмұнынан сұрақтарды жаппай импорттау
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Рұқсат жоқ" }, { status: 401 });

  const { subjectId, content } = await req.json().catch(() => ({}));
  if (!subjectId || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Пән мен файл мазмұны керек" }, { status: 400 });
  }

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) {
    return NextResponse.json({ error: "Пән табылмады" }, { status: 400 });
  }

  const { questions, issues } = parseQuestions(content);

  if (questions.length === 0) {
    return NextResponse.json(
      { error: "Бірде-бір жарамды сұрақ табылмады", issues },
      { status: 400 }
    );
  }

  await prisma.question.createMany({
    data: questions.map((q) => ({
      subjectId,
      text: q.text,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctKey: q.correctKey,
    })),
  });

  return NextResponse.json({
    ok: true,
    created: questions.length,
    skipped: issues.length,
    issues,
  });
}
