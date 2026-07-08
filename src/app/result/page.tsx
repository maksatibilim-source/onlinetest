import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { levelLabel } from "@/lib/utils";

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const { studentId } = await searchParams;

  const student = studentId
    ? await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          attempts: { include: { subject: true }, orderBy: { startedAt: "asc" } },
        },
      })
    : null;

  if (!student) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <p className="text-gray-600">Нәтиже табылмады.</p>
          <Link href="/" className="mt-4 inline-block text-brand-600 hover:underline">
            Басты бетке
          </Link>
        </div>
      </main>
    );
  }

  const finished = student.attempts.filter((a) => a.status === "finished");
  const totalScore = finished.reduce((s, a) => s + a.score, 0);
  const totalQuestions = finished.reduce((s, a) => s + a.totalQuestions, 0);
  const totalViolations = student.attempts.reduce((s, a) => s + a.violations, 0);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✅
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Тест аяқталды!</h1>
        <p className="mt-1 text-sm text-gray-500">
          {student.fullName} · {levelLabel(student.grade)}
        </p>

        <div className="my-6 rounded-xl bg-brand-50 py-5">
          <p className="text-sm text-brand-700">Жалпы нәтиже</p>
          <p className="text-4xl font-extrabold text-brand-700">
            {totalScore}
            <span className="text-2xl text-brand-400">/{totalQuestions}</span>
          </p>
        </div>

        <div className="space-y-2 text-left">
          {finished.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              Бірде-бір пән тапсырылмады.
            </p>
          ) : (
            finished.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2 text-sm"
              >
                <span className="text-gray-700">{a.subject.name}</span>
                <span className="font-semibold text-gray-900">
                  {a.score}/{a.totalQuestions}
                </span>
              </div>
            ))
          )}
        </div>

        {totalViolations > 0 && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            Тест кезінде {totalViolations} рет ереже бұзу тіркелген.
          </p>
        )}

        <Link
          href="/"
          className="mt-6 inline-block w-full rounded-xl bg-brand-500 py-3 font-semibold text-white transition hover:bg-brand-600"
        >
          Басты бетке оралу
        </Link>
      </div>
    </main>
  );
}
