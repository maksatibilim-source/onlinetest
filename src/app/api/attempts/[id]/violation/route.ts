import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Прокторинг: ереже бұзу тіркеу (санын арттыру)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { total } = await req.json().catch(() => ({}));

  const attempt = await prisma.attempt.findUnique({ where: { id } });
  if (!attempt || attempt.status === "finished") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Клиент жіберген жалпы санмен синхрондаймыз (артқа кетпейді)
  const next =
    typeof total === "number"
      ? Math.max(attempt.violations, total)
      : attempt.violations + 1;

  await prisma.attempt.update({ where: { id }, data: { violations: next } });
  return NextResponse.json({ ok: true, violations: next });
}
