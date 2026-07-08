"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GRADES, TEACHER_GRADE } from "@/lib/utils";

export default function QuestionnairePage() {
  const router = useRouter();
  const [codeId, setCodeId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState<number>(5);
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Код тексерілмесе — логинге қайтарамыз
  useEffect(() => {
    const id = sessionStorage.getItem("ot_codeId");
    if (!id) {
      router.replace("/");
      return;
    }
    setCodeId(id);
    const g = sessionStorage.getItem("ot_grade");
    if (g === String(TEACHER_GRADE)) {
      setIsTeacher(true);
      setGrade(TEACHER_GRADE); // мұғалім — сынып таңдалмайды
    } else if (g) {
      setGrade(Number(g));
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!codeId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeId, fullName: fullName.trim(), grade }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Тестті бастау мүмкін болмады");

      sessionStorage.setItem("ot_studentId", data.studentId);
      sessionStorage.setItem("ot_studentName", fullName.trim());
      router.push("/subjects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Қате шықты");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
      >
        <h1 className="text-center text-2xl font-bold text-gray-900">Анкета</h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Тестті бастамас бұрын деректеріңізді толтырыңыз
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Аты-жөні</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Мысалы: Айсұлу Нұрланқызы"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-brand-500 focus:outline-none"
            />
          </div>

          {isTeacher ? (
            <div className="rounded-lg border-2 border-brand-200 bg-brand-50 px-4 py-3 text-center text-sm font-medium text-brand-700">
              👩‍🏫 Мұғалім біліктілік тесті
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Сыныбы</label>
              <div className="grid grid-cols-5 gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`rounded-lg border-2 py-2.5 font-semibold transition ${
                      grade === g
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !fullName.trim()}
          className="mt-6 w-full rounded-xl bg-brand-500 py-3 font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {loading ? "Дайындалуда..." : "Тестті бастау →"}
        </button>
      </form>
    </main>
  );
}
