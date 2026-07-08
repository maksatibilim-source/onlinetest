"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS_PER_SUBJECT } from "@/lib/utils";

interface SubjectItem {
  id: string;
  name: string;
  questionCount: number;
  attempt: { id: string; status: string; score: number; totalQuestions: number } | null;
}

export default function SubjectsPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("");
  const [grade, setGrade] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [sessionActive, setSessionActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (sid: string) => {
    const res = await fetch(`/api/session/subjects?studentId=${sid}`);
    const data = await res.json();
    if (!res.ok) {
      router.replace("/");
      return;
    }
    setStudentName(data.studentName);
    setGrade(data.grade);
    setSubjects(data.subjects);
    setSessionActive(data.sessionActive);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const sid = sessionStorage.getItem("ot_studentId");
    if (!sid) {
      router.replace("/");
      return;
    }
    setStudentId(sid);
    void load(sid);
  }, [router, load]);

  async function startSubject(subjectId: string) {
    if (!studentId) return;
    setBusyId(subjectId);
    setError("");
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, subjectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Пәнді бастау мүмкін болмады");
      sessionStorage.setItem("ot_attemptId", data.attemptId);
      router.push("/test");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Қате шықты");
      setBusyId(null);
    }
  }

  async function finishSession() {
    if (!studentId) return;
    if (!confirm("Тестті толық аяқтайсыз ба? Кодыңыз жарамсыз болады.")) return;
    await fetch("/api/session/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    router.replace(`/result?studentId=${studentId}`);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-gray-500">
        Жүктелуде...
      </main>
    );
  }

  const allFinished =
    subjects.filter((s) => s.questionCount > 0).length > 0 &&
    subjects
      .filter((s) => s.questionCount > 0)
      .every((s) => s.attempt?.status === "finished");

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 to-slate-100 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Пәндер</h1>
          <p className="mt-1 text-sm text-gray-500">
            {studentName} · {grade}-сынып · әр пәнде {QUESTIONS_PER_SUBJECT} сұрақ
          </p>
        </div>

        {!sessionActive && (
          <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-center text-sm text-amber-700">
            Сессия аяқталған. Нәтижені төменнен көре аласыз.
          </div>
        )}

        <div className="space-y-3">
          {subjects.length === 0 && (
            <p className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm">
              Сіздің сыныбыңызға әзірге пән қосылмаған.
            </p>
          )}

          {subjects.map((s) => {
            const done = s.attempt?.status === "finished";
            const inProgress = s.attempt?.status === "in_progress";
            const empty = s.questionCount === 0;
            return (
              <div
                key={s.id}
                className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{s.name}</p>
                  <p className="text-sm text-gray-500">
                    {empty ? (
                      "Сұрақ жоқ"
                    ) : done ? (
                      <span className="text-green-600">
                        ✓ Аяқталды: {s.attempt!.score}/{s.attempt!.totalQuestions}
                      </span>
                    ) : (
                      `${Math.min(s.questionCount, QUESTIONS_PER_SUBJECT)} сұрақ`
                    )}
                  </p>
                </div>

                {done ? (
                  <span className="flex-none rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
                    Тапсырылды
                  </span>
                ) : (
                  <button
                    onClick={() => startSubject(s.id)}
                    disabled={empty || !sessionActive || busyId === s.id}
                    className="flex-none rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busyId === s.id
                      ? "Ашылуда..."
                      : inProgress
                        ? "Жалғастыру →"
                        : "Тапсыру →"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

        {sessionActive && (
          <div className="mt-8 text-center">
            {allFinished && (
              <p className="mb-2 text-sm text-green-600">
                Барлық пәнді тапсырдыңыз! 🎉
              </p>
            )}
            <button
              onClick={finishSession}
              className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Тестті толық аяқтау
            </button>
          </div>
        )}

        {!sessionActive && (
          <div className="mt-8 text-center">
            <button
              onClick={() => router.replace(`/result?studentId=${studentId}`)}
              className="rounded-xl bg-brand-500 px-6 py-2.5 font-medium text-white transition hover:bg-brand-600"
            >
              Нәтижені көру →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
