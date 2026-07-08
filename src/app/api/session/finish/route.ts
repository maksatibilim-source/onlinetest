import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Сессияны қолмен аяқтау: оқушыға байланған белсенді кодты жарамсыз ету.
export async function POST(req: Request) {
  const { studentId } = await req.json().catch(() => ({}));
  if (!studentId) {
    return NextResponse.json({ error: "studentId керек" }, { status: 400 });
  }

  await prisma.oneTimeCode.updateMany({
    where: { studentId, status: "active" },
    data: { status: "used", usedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
