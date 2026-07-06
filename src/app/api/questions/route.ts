import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { OPTION_KEYS } from "@/lib/utils";

// Админ жаңа сұрақ қосады (4 нұсқа + дұрыс кілт + міндетті емес сурет)
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Рұқсат жоқ" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { subjectId, text, optionA, optionB, optionC, optionD, correctKey, imageUrl } = body;

  if (
    !subjectId ||
    !text?.trim() ||
    !optionA?.trim() ||
    !optionB?.trim() ||
    !optionC?.trim() ||
    !optionD?.trim()
  ) {
    return NextResponse.json({ error: "Барлық өрісті толтырыңыз" }, { status: 400 });
  }
  if (!OPTION_KEYS.includes(correctKey)) {
    return NextResponse.json({ error: "Дұрыс жауап кілті қате" }, { status: 400 });
  }

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) {
    return NextResponse.json({ error: "Пән табылмады" }, { status: 400 });
  }

  const question = await prisma.question.create({
    data: {
      subjectId,
      text: text.trim(),
      optionA,
      optionB,
      optionC,
      optionD,
      correctKey,
      imageUrl: imageUrl || null,
    },
  });

  return NextResponse.json({ ok: true, id: question.id });
}
