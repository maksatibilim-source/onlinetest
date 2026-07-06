import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { generate4DigitCode } from "@/lib/utils";

// Админ жаңа 4 таңбалы код генерациялайды
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Рұқсат жоқ" }, { status: 401 });

  const { grade } = await req.json().catch(() => ({}));

  // Бос код табу. Егер сан бос болса — аламыз; ескі (used/revoked) болса — қайта қолданамыз.
  let code = "";
  for (let i = 0; i < 50; i++) {
    const candidate = generate4DigitCode();
    const existing = await prisma.oneTimeCode.findUnique({ where: { code: candidate } });
    if (!existing) {
      code = candidate;
      break;
    }
    if (existing.status !== "active") {
      // ескі кодты босатамыз (attempt.codeId → SetNull арқасында деректер сақталады)
      await prisma.oneTimeCode.delete({ where: { id: existing.id } });
      code = candidate;
      break;
    }
  }

  if (!code) {
    return NextResponse.json({ error: "Бос код табылмады, көбін жарамсыз етіңіз" }, { status: 409 });
  }

  const created = await prisma.oneTimeCode.create({
    data: { code, grade: typeof grade === "number" ? grade : null },
  });

  return NextResponse.json({ ok: true, code: created.code, id: created.id });
}
