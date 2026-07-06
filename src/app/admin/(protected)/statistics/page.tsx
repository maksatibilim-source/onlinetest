import { prisma } from "@/lib/prisma";
import { StatisticsTable, type StatRow } from "@/components/admin/StatisticsTable";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const attempts = await prisma.attempt.findMany({
    orderBy: { startedAt: "desc" },
    include: {
      student: true,
      answers: { include: { question: { include: { subject: true } } } },
    },
  });

  const rows: StatRow[] = attempts.map((a) => {
    const bySubject = new Map<string, { correct: number; total: number }>();
    for (const ans of a.answers) {
      const name = ans.question.subject.name;
      const cur = bySubject.get(name) ?? { correct: 0, total: 0 };
      cur.total += 1;
      if (ans.isCorrect) cur.correct += 1;
      bySubject.set(name, cur);
    }
    return {
      attemptId: a.id,
      fullName: a.student.fullName,
      grade: a.student.grade,
      subjects: [...bySubject.entries()].map(([name, s]) => ({ name, ...s })),
      totalScore: a.score,
      totalQuestions: a.totalQuestions,
      violations: a.violations,
      status: a.status,
      finishedAt: a.finishedAt?.toISOString() ?? null,
    };
  });

  const totalViolations = rows.reduce((sum, r) => sum + r.violations, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Статистика</h1>
      <p className="mt-1 text-sm text-gray-500">
        Оқушылардың нәтижелері мен прокторинг көрсеткіштері
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-2xl font-extrabold text-gray-900">{rows.length}</p>
          <p className="text-sm text-gray-500">Барлық тапсыру</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-2xl font-extrabold text-gray-900">
            {rows.filter((r) => r.status === "finished").length}
          </p>
          <p className="text-sm text-gray-500">Аяқталды</p>
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
