import { prisma } from "@/lib/prisma";
import { CodeGenerator, type CodeRow } from "@/components/admin/CodeGenerator";
import { TEACHER_GRADE } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CodesPage() {
  const [codes, teacherSubjects] = await Promise.all([
    prisma.oneTimeCode.findMany({
      orderBy: { createdAt: "desc" },
      include: { student: true },
    }),
    prisma.subject.findMany({
      where: { grade: TEACHER_GRADE },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const nameById = new Map(teacherSubjects.map((s) => [s.id, s.name]));

  const rows: CodeRow[] = codes.map((c) => ({
    id: c.id,
    code: c.code,
    status: c.status,
    grade: c.grade,
    subjectNames: c.subjectIds
      .map((id) => nameById.get(id))
      .filter((n): n is string => Boolean(n)),
    studentName: c.student?.fullName ?? null,
    createdAt: c.createdAt.toISOString(),
    usedAt: c.usedAt?.toISOString() ?? null,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Бір реттік кодтар</h1>
      <p className="mt-1 text-sm text-gray-500">
        5–9 сынып немесе Мұғалім біліктілік тесті үшін код беріңіз. Код тест аяқталғанда
        автоматты жарамсыз болады.
      </p>
      <div className="mt-6">
        <CodeGenerator codes={rows} teacherSubjects={teacherSubjects} />
      </div>
    </div>
  );
}
