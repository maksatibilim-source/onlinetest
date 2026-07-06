import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// Сұрақты жою
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Рұқсат жоқ" }, { status: 401 });

  const { id } = await params;
  await prisma.question.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
