import { prisma } from "@/lib/prisma";
import { CodeGenerator, type CodeRow } from "@/components/admin/CodeGenerator";

export const dynamic = "force-dynamic";

export default async function CodesPage() {
  const codes = await prisma.oneTimeCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { student: true },
  });

  const rows: CodeRow[] = codes.map((c) => ({
    id: c.id,
    code: c.code,
    status: c.status,
    grade: c.grade,
    studentName: c.student?.fullName ?? null,
    createdAt: c.createdAt.toISOString(),
    usedAt: c.usedAt?.toISOString() ?? null,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Бір реттік кодтар</h1>
      <p className="mt-1 text-sm text-gray-500">
        Код оқушы тестті аяқтаған сәтте автоматты түрде жарамсыз болады.
      </p>
      <div className="mt-6">
        <CodeGenerator codes={rows} />
      </div>
    </div>
  );
}
