import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { generate4DigitCode, TEACHER_GRADE } from "@/lib/utils";

// Админ жаңа 4 таңбалы код генерациялайды.
// grade: 5–9 (сынып) | 0 (мұғалім) | null (кез келген сынып).
// Мұғалім коды үшін subjectIds — таңдалған нақты пәндер (1 не одан көп).
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Рұқсат жоқ" }, { status: 401 });

  const { grade, subjectIds } = await req.json().catch(() => ({}));
  const gradeVal = typeof grade === "number" ? grade : null;

  // Мұғалім коды — кемінде бір мұғалім пәні таңдалуы керек
  let validSubjectIds: string[] = [];
  if (gradeVal === TEACHER_GRADE) {
    if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
      return NextResponse.json(
        { error: "Мұғалім коды үшін кемінде бір пән таңдаңыз" },
        { status: 400 }
      );
    }
    const found = await prisma.subject.findMany({
      where: { id: { in: subjectIds }, grade: TEACHER_GRADE },
      select: { id: true },
    });
    validSubjectIds = found.map((s) => s.id);
    if (validSubjectIds.length === 0) {
      return NextResponse.json({ error: "Таңдалған пәндер табылмады" }, { status: 400 });
    }
  }

  // Бос код табу (ескі used/revoked кодты қайта қолданамыз)
  let code = "";
  for (let i = 0; i < 50; i++) {
    const candidate = generate4DigitCode();
    const existing = await prisma.oneTimeCode.findUnique({ where: { code: candidate } });
    if (!existing) {
      code = candidate;
      break;
    }
    if (existing.status !== "active") {
      await prisma.oneTimeCode.delete({ where: { id: existing.id } });
      code = candidate;
      break;
    }
  }
  if (!code) {
    return NextResponse.json(
      { error: "Бос код табылмады, көбін жарамсыз етіңіз" },
      { status: 409 }
    );
  }

  const created = await prisma.oneTimeCode.create({
    data: { code, grade: gradeVal, subjectIds: validSubjectIds },
  });

  return NextResponse.json({ ok: true, code: created.code, id: created.id });
}
