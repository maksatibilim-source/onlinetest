import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Оқушы бір реттік кодты тексереді (ашық endpoint)
export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({}));
  if (!/^\d{4}$/.test(code ?? "")) {
    return NextResponse.json({ error: "4 таңбалы код енгізіңіз" }, { status: 400 });
  }

  const otc = await prisma.oneTimeCode.findUnique({ where: { code } });
  if (!otc || otc.status !== "active") {
    return NextResponse.json({ error: "Код қате немесе жарамсыз" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, codeId: otc.id, grade: otc.grade });
}
