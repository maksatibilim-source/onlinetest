"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GRADES } from "@/lib/utils";

export function SubjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, grade }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Пәнді сақтау мүмкін болмады");
      }
      setName("");
      router.refresh(); // тізімді жаңарту
    } catch (err) {
      setError(err instanceof Error ? err.message : "Қате шықты");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <label className="mb-1 block text-sm font-medium text-gray-700">Пән атауы</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Мысалы: Математика"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Сынып</label>
        <select
          value={grade}
          onChange={(e) => setGrade(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        >
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}-сынып
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-brand-500 px-4 py-2 font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
      >
        {loading ? "Сақталуда..." : "Пән қосу"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
