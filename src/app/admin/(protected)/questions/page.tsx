import { prisma } from "@/lib/prisma";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { MathContent } from "@/components/MathContent";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { OPTION_LABELS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  const [subjects, questions] = await Promise.all([
    prisma.subject.findMany({ orderBy: [{ grade: "asc" }, { name: "asc" }] }),
    prisma.question.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { subject: true },
    }),
  ]);

  const correctIndex: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Сұрақтар</h1>
      <p className="mt-1 text-sm text-gray-500">
        LaTeX формулалары ($...$) және сурет қолдауымен
      </p>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Жаңа сұрақ енгізу</h2>
        <QuestionForm subjects={subjects} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Соңғы сұрақтар</h2>
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-700">
                  {q.subject.grade}-сынып · {q.subject.name}
                </span>
                <DeleteButton url={`/api/questions/${q.id}`} confirmText="Сұрақты жоясыз ба?" />
              </div>
              {q.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={q.imageUrl} alt="" className="mb-2 max-h-40 rounded" />
              )}
              <div className="text-gray-900">
                <MathContent block>{q.text}</MathContent>
              </div>
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                {[q.optionA, q.optionB, q.optionC, q.optionD].map((opt, i) => {
                  const isCorrect = correctIndex[q.correctKey] === i;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-1.5 rounded px-2 py-1 text-sm ${
                        isCorrect ? "bg-green-50 text-green-800" : "text-gray-600"
                      }`}
                    >
                      <span className="font-semibold">{OPTION_LABELS[i]}.</span>
                      <MathContent>{opt}</MathContent>
                      {isCorrect && <span className="ml-auto text-xs">✔ дұрыс</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {questions.length === 0 && (
            <p className="text-sm text-gray-500">Әзірге сұрақ жоқ.</p>
          )}
        </div>
      </section>
    </div>
  );
}
