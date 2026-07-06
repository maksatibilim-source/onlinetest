"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MathContent } from "@/components/MathContent";
import { ProctoringWarning } from "@/components/ProctoringWarning";
import { useProctoring } from "@/hooks/useProctoring";
import { OPTION_LABELS } from "@/lib/utils";

interface QuizOption {
  key: string; // дерекқордағы шын кілт (A|B|C|D) — араластырылған
  text: string;
}
interface QuizQuestion {
  id: string;
  text: string;
  imageUrl: string | null;
  subjectName: string;
  options: QuizOption[];
}

export default function TestPage() {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);

  // Прокторинг: ереже бұзу тіркелгенде дереу серверге жазамыз
  const reportViolation = useCallback(
    async (total: number) => {
      const id = attemptId ?? sessionStorage.getItem("ot_attemptId");
      if (!id) return;
      await fetch(`/api/attempts/${id}/violation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total }),
      }).catch(() => {});
    },
    [attemptId]
  );

  const { violations, showWarning, dismissWarning } = useProctoring({
    enabled: !loading && !finished,
    onViolation: reportViolation,
  });

  // Тестті жүктеу
  useEffect(() => {
    const id = sessionStorage.getItem("ot_attemptId");
    if (!id) {
      router.replace("/");
      return;
    }
    setAttemptId(id);
    setStudentName(sessionStorage.getItem("ot_studentName") ?? "");

    (async () => {
      try {
        const res = await fetch(`/api/questions/quiz?attemptId=${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Сұрақтарды жүктеу қатесі");
        setQuestions(data.questions);
      } catch {
        router.replace("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function selectAnswer(questionId: string, key: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: key }));
  }

  const answeredCount = Object.keys(answers).length;

  async function handleFinish() {
    if (!attemptId) return;
    const unanswered = questions.length - answeredCount;
    const msg =
      unanswered > 0
        ? `Жауап берілмеген ${unanswered} сұрақ бар. Тестті аяқтайсыз ба?`
        : "Тестті аяқтап, жауаптарды тапсырасыз ба?";
    if (!confirm(msg)) return;

    setSubmitting(true);
    setFinished(true); // прокторингті өшіреді
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        selectedKey: answers[q.id] ?? null,
      }));
      const res = await fetch(`/api/attempts/${attemptId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload, violations }),
      });
      if (!res.ok) throw new Error();

      // Сессияны тазарту — кодты қайта қолдануға болмайды
      sessionStorage.removeItem("ot_codeId");
      sessionStorage.removeItem("ot_attemptId");
      sessionStorage.removeItem("ot_grade");
      router.replace(`/result?attemptId=${attemptId}`);
    } catch {
      setSubmitting(false);
      setFinished(false);
      alert("Тапсыру кезінде қате шықты. Қайта көріңіз.");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-gray-500">
        Тест жүктелуде...
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-gray-600">Бұл сынып үшін әзірге сұрақтар қосылмаған.</p>
      </main>
    );
  }

  const q = questions[current];

  return (
    <main className="min-h-screen bg-slate-100 pb-28">
      {/* Жоғарғы жабысқақ панель */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{studentName}</p>
            <p className="text-xs text-gray-500">
              Сұрақ {current + 1} / {questions.length} · Жауап берілді: {answeredCount}
            </p>
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
              violations > 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"
            }`}
            title="Ереже бұзу саны"
          >
            ⚠️ {violations}
          </div>
        </div>
        {/* Прогресс сызығы */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-brand-500 transition-all"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Сұрақ картасы */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-600">
            {q.subjectName}
          </p>
          {q.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={q.imageUrl} alt="" className="mb-4 max-h-72 rounded-lg" />
          )}
          <div className="text-lg text-gray-900">
            <MathContent block>{q.text}</MathContent>
          </div>

          <div className="mt-5 space-y-3">
            {q.options.map((opt, i) => {
              const selected = answers[q.id] === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => selectAnswer(q.id, opt.key)}
                  className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${
                    selected
                      ? "border-brand-500 bg-brand-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm font-bold ${
                      selected ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {OPTION_LABELS[i]}
                  </span>
                  <span className="pt-0.5 text-gray-800">
                    <MathContent>{opt.text}</MathContent>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Навигация */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
          >
            ← Алдыңғы
          </button>
          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
              className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Келесі →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={submitting}
              className="rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? "Тапсырылуда..." : "✓ Аяқтау"}
            </button>
          )}
        </div>

        {/* Сұрақтар палитрасы */}
        <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Сұрақтар
          </p>
          <div className="flex flex-wrap gap-2">
            {questions.map((question, i) => {
              const answered = answers[question.id] !== undefined;
              const isCurrent = i === current;
              return (
                <button
                  key={question.id}
                  onClick={() => setCurrent(i)}
                  className={`h-9 w-9 rounded-lg text-sm font-semibold transition ${
                    isCurrent
                      ? "bg-brand-500 text-white"
                      : answered
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showWarning && <ProctoringWarning count={violations} onClose={dismissWarning} />}
    </main>
  );
}
