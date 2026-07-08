"use client";

export interface StatSubject {
  name: string;
  score: number;
  total: number;
  status: string; // "finished" | "in_progress"
  violations: number;
}

export interface StatRow {
  studentId: string;
  fullName: string;
  grade: number;
  subjects: StatSubject[];
  totalScore: number;
  totalQuestions: number;
  totalViolations: number;
  finishedCount: number;
  createdAt: string;
}

export function StatisticsTable({ rows }: { rows: StatRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
        Әзірге тіркелген оқушы жоқ.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Аты-жөні</th>
            <th className="px-4 py-3">Сынып</th>
            <th className="px-4 py-3">Пәндер бойынша нәтиже</th>
            <th className="px-4 py-3 text-center">Жалпы ұпай</th>
            <th className="px-4 py-3 text-center">Нарушение</th>
            <th className="px-4 py-3">Тіркелген уақыт</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => (
            <tr key={r.studentId} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{r.fullName}</td>
              <td className="px-4 py-3 text-gray-600">{r.grade}-сынып</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {r.subjects.length === 0 ? (
                    <span className="text-gray-400">— тапсырмаған</span>
                  ) : (
                    r.subjects.map((s) => (
                      <span
                        key={s.name}
                        className={`rounded-full px-2.5 py-0.5 text-xs ${
                          s.status === "finished"
                            ? "bg-brand-50 text-brand-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                        title={s.status === "finished" ? "Аяқталды" : "Жүріп жатыр"}
                      >
                        {s.name}:{" "}
                        {s.status === "finished" ? `${s.score}/${s.total}` : "жүруде"}
                      </span>
                    ))
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-center font-semibold text-gray-900">
                {r.totalScore}/{r.totalQuestions}
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-block min-w-[2rem] rounded-full px-2 py-0.5 text-xs font-semibold ${
                    r.totalViolations > 0
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {r.totalViolations}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500">
                {new Date(r.createdAt).toLocaleString("kk-KZ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
