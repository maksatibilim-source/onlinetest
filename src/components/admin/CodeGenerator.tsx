"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GRADES, TEACHER_GRADE, levelLabel } from "@/lib/utils";

export interface CodeRow {
  id: string;
  code: string;
  status: string;
  grade: number | null;
  subjectNames: string[]; // мұғалім коды үшін таңдалған пәндер
  studentName: string | null;
  createdAt: string;
  usedAt: string | null;
}

interface TeacherSubject {
  id: string;
  name: string;
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  active: { text: "Белсенді", cls: "bg-green-100 text-green-700" },
  used: { text: "Қолданылған", cls: "bg-gray-200 text-gray-600" },
  revoked: { text: "Жарамсыз", cls: "bg-red-100 text-red-700" },
};

export function CodeGenerator({
  codes,
  teacherSubjects,
}: {
  codes: CodeRow[];
  teacherSubjects: TeacherSubject[];
}) {
  const router = useRouter();
  // level: "" (барлығы) | "5".."9" | "0" (мұғалім)
  const [level, setLevel] = useState<string>("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastCode, setLastCode] = useState<string | null>(null);

  const isTeacher = level === String(TEACHER_GRADE);

  function toggleSubject(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function generate() {
    setError("");
    if (isTeacher && selected.length === 0) {
      setError("Мұғалім коды үшін кемінде бір пән таңдаңыз");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: level === "" ? null : Number(level),
          subjectIds: isTeacher ? selected : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Код генерациялау қатесі");
      setLastCode(data.code);
      setSelected([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Қате шықты");
    } finally {
      setLoading(false);
    }
  }

  async function revoke(id: string) {
    await fetch(`/api/codes/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Деңгей</label>
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                setSelected([]);
                setError("");
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            >
              <option value="">Барлығы (кез келген сынып)</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {levelLabel(g)}
                </option>
              ))}
              <option value={TEACHER_GRADE}>{levelLabel(TEACHER_GRADE)}</option>
            </select>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-lg bg-brand-500 px-4 py-2 font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? "Генерацияланды..." : "🔑 Жаңа код генерациялау"}
          </button>
          {lastCode && (
            <div className="rounded-lg bg-green-50 px-4 py-2 text-green-800">
              Жаңа код:{" "}
              <span className="font-mono text-lg font-bold tracking-widest">{lastCode}</span>
            </div>
          )}
        </div>

        {/* Мұғалім таңдалса — пәндерді белгілеу */}
        {isTeacher && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Мұғалім тапсыратын пән(дер) — 1 немесе одан көп:
            </p>
            {teacherSubjects.length === 0 ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Алдымен «Пәндер» бөлімінен «Мұғалім» деңгейіне пән қосыңыз.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {teacherSubjects.map((s) => {
                  const on = selected.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSubject(s.id)}
                      className={`rounded-full border-2 px-3 py-1 text-sm transition ${
                        on
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {on ? "✓ " : ""}
                      {s.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Код</th>
              <th className="px-4 py-3">Деңгей / пән</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Оқушы</th>
              <th className="px-4 py-3">Құрылған</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {codes.map((c) => {
              const s = STATUS_LABEL[c.status] ?? STATUS_LABEL.revoked;
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-lg font-bold tracking-widest text-gray-900">
                    {c.code}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="font-medium">{levelLabel(c.grade)}</span>
                    {c.grade === TEACHER_GRADE && c.subjectNames.length > 0 && (
                      <span className="ml-1 text-xs text-gray-400">
                        ({c.subjectNames.join(", ")})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${s.cls}`}>
                      {s.text}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.studentName ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(c.createdAt).toLocaleString("kk-KZ")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.status === "active" && (
                      <button
                        onClick={() => revoke(c.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Жарамсыз ету
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {codes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Әзірге код жоқ. Жоғарыдан жаңа код генерациялаңыз.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
