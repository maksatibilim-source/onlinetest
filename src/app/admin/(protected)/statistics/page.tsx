import { prisma } from "@/lib/prisma";
import { StatisticsTable, type StatRow } from "@/components/admin/StatisticsTable";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const students = await prisma.student.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      attempts: { include: { subject: true }, orderBy: { startedAt: "asc" } },
    },
  });

  const rows: StatRow[] = students.map((s) => {
    const finished = s.attempts.filter((a) => a.status === "finished");
    return {
      studentId: s.id,
      fullName: s.fullName,
      grade: s.grade,
      subjects: s.attempts.map((a) => ({
        name: a.subject.name,
        score: a.score,
        total: a.totalQuestions,
        status: a.status,
        violations: a.violations,
      })),
      totalScore: finished.reduce((x, a) => x + a.score, 0),
      totalQuestions: finished.reduce((x, a) => x + a.totalQuestions, 0),
      totalViolations: s.attempts.reduce((x, a) => x + a.violations, 0),
      finishedCount: finished.length,
      createdAt: s.createdAt.toISOString(),
    };
  });

  const totalViolations = rows.reduce((sum, r) => sum + r.totalViolations, 0);
  const totalFinished = rows.reduce((sum, r) => sum + r.finishedCount, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Статистика</h1>
      <p className="mt-1 text-sm text-gray-500">
        Әр оқушының пәндер бойынша нәтижесі мен прокторинг көрсеткіштері
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-2xl font-extrabold text-gray-900">{rows.length}</p>
          <p className="text-sm text-gray-500">Тіркелген оқушы</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-2xl font-extrabold text-gray-900">{totalFinished}</p>
          <p className="text-sm text-gray-500">Аяқталған пән тесті</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-2xl font-extrabold text-red-600">{totalViolations}</p>
          <p className="text-sm text-gray-500">Жалпы нарушение</p>
        </div>
      </div>

      <div className="mt-6">
        <StatisticsTable rows={rows} />
      </div>
    </div>
  );
}
