import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ attemptId?: string }>;
}) {
  const { attemptId } = await searchParams;

  const attempt = attemptId
    ? await prisma.attempt.findUnique({
        where: { id: attemptId },
        include: {
          student: true,
          answers: { include: { question: { include: { subject: true } } } },
        },
      })
    : null;

  if (!attempt) {
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

  // Пәндер бойынша топтастыру
  const bySubject = new Map<string, { correct: number; total: number }>();
  for (const a of attempt.answers) {
    const name = a.question.subject.name;
    const cur = bySubject.get(name) ?? { correct: 0, total: 0 };
    cur.total += 1;
    if (a.isCorrect) cur.correct += 1;
    bySubject.set(name, cur);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✅
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Тест аяқталды!</h1>
        <p className="mt-1 text-sm text-gray-500">{attempt.student.fullName}</p>

        <div className="my-6 rounded-xl bg-brand-50 py-5">
          <p className="text-sm text-brand-700">Жалпы нәтиже</p>
          <p className="text-4xl font-extrabold text-brand-700">
            {attempt.score}
            <span className="text-2xl text-brand-400">/{attempt.totalQuestions}</span>
          </p>
        </div>

        <div className="space-y-2 text-left">
          {[...bySubject.entries()].map(([name, s]) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2 text-sm"
            >
              <span className="text-gray-700">{name}</span>
              <span className="font-semibold text-gray-900">
                {s.correct}/{s.total}
              </span>
            </div>
          ))}
        </div>

        {attempt.violations > 0 && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            Тест кезінде {attempt.violations} рет ереже бұзу тіркелген.
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
