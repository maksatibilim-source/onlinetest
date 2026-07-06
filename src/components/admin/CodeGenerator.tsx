"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GRADES } from "@/lib/utils";

export interface CodeRow {
  id: string;
  code: string;
  status: string;
  grade: number | null;
  studentName: string | null;
  createdAt: string;
  usedAt: string | null;
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  active: { text: "Белсенді", cls: "bg-green-100 text-green-700" },
  used: { text: "Қолданылған", cls: "bg-gray-200 text-gray-600" },
  revoked: { text: "Жарамсыз", cls: "bg-red-100 text-red-700" },
};

export function CodeGenerator({ codes }: { codes: CodeRow[] }) {
  const router = useRouter();
  const [grade, setGrade] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: grade === "" ? null : grade }),
      });
      const data = await res.json();
      if (res.ok) setLastCode(data.code);
      router.refresh();
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
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Сынып <span className="font-normal text-gray-400">(міндетті емес)</span>
          </label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value === "" ? "" : Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          >
            <option value="">Барлығы</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}-сынып
              </option>
            ))}
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

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Код</th>
              <th className="px-4 py-3">Сынып</th>
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
                    {c.grade ? `${c.grade}-сынып` : "—"}
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
