"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MathContent } from "@/components/MathContent";
import { OPTION_KEYS, OPTION_LABELS } from "@/lib/utils";

interface SubjectOption {
  id: string;
  name: string;
  grade: number;
}

interface QuestionFormProps {
  subjects: SubjectOption[];
}

const EMPTY_OPTIONS: Record<string, string> = { A: "", B: "", C: "", D: "" };

export function QuestionForm({ subjects }: QuestionFormProps) {
  const router = useRouter();

  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [text, setText] = useState("");
  const [options, setOptions] = useState<Record<string, string>>(EMPTY_OPTIONS);
  const [correctKey, setCorrectKey] = useState("A");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSubmit = useMemo(
    () =>
      subjectId &&
      text.trim() &&
      OPTION_KEYS.every((k) => options[k].trim()),
    [subjectId, text, options]
  );

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      if (!res.ok) throw new Error("Суретті жүктеу мүмкін болмады");
      const data = await res.json();
      setImageUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Жүктеу қатесі");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          text,
          optionA: options.A,
          optionB: options.B,
          optionC: options.C,
          optionD: options.D,
          correctKey,
          imageUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Сұрақты сақтау мүмкін болмады");
      }
      // Форманы тазарту (пәнді сол күйінде қалдырамыз — қатарынан сұрақ енгізу ыңғайлы)
      setText("");
      setOptions({ ...EMPTY_OPTIONS });
      setCorrectKey("A");
      setImageUrl(null);
      setSuccess("Сұрақ сәтті қосылды ✔");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Қате шықты");
    } finally {
      setSaving(false);
    }
  }

  if (subjects.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Алдымен «Пәндер» бөлімінен кемінде бір пән қосыңыз.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
      {/* Сол жақ: енгізу өрістері */}
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Пән</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.grade}-сынып · {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Сұрақ мәтіні{" "}
            <span className="font-normal text-gray-400">(LaTeX: $...$ немесе $$...$$)</span>
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            required
            placeholder={"Мысалы: Есептеңіз: $\\frac{1}{2} + \\frac{1}{3} = ?$"}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Сурет жүктеу (міндетті емес) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Сурет <span className="font-normal text-gray-400">(міндетті емес)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-brand-700 hover:file:bg-brand-100"
          />
          {uploading && <p className="mt-1 text-xs text-gray-500">Жүктелуде...</p>}
          {imageUrl && (
            <div className="mt-2 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Сұрақ суреті" className="h-16 rounded border" />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="text-xs text-red-600 hover:underline"
              >
                Жою
              </button>
            </div>
          )}
        </div>

        {/* 4 нұсқа + дұрыс жауап радиосы */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Жауап нұсқалары (дұрысын белгілеңіз)
          </label>
          {OPTION_KEYS.map((key, i) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={correctKey === key}
                onChange={() => setCorrectKey(key)}
                className="h-4 w-4 accent-green-600"
                title="Дұрыс жауап"
              />
              <span className="w-6 font-semibold text-gray-500">{OPTION_LABELS[i]}.</span>
              <input
                value={options[key]}
                onChange={(e) => setOptions((o) => ({ ...o, [key]: e.target.value }))}
                required
                placeholder={`${OPTION_LABELS[i]} нұсқасы`}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="rounded-lg bg-brand-500 px-5 py-2.5 font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? "Сақталуда..." : "Сұрақты қосу"}
          </button>
          {success && <span className="text-sm text-green-600">{success}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>

      {/* Оң жақ: тірі превью (KaTeX рендер) */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Превью (оқушы осылай көреді)
        </p>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="mb-3 max-h-48 rounded" />
          )}
          <div className="text-gray-900">
            <MathContent block>{text || "_Сұрақ мәтіні осы жерде көрінеді..._"}</MathContent>
          </div>
          <div className="mt-4 space-y-2">
            {OPTION_KEYS.map((key, i) => (
              <div
                key={key}
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                  correctKey === key
                    ? "border-green-400 bg-green-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <span className="font-semibold text-gray-500">{OPTION_LABELS[i]}.</span>
                <MathContent>{options[key] || "—"}</MathContent>
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}
