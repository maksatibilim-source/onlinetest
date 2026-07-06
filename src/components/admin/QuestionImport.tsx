"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { parseQuestions, type ParseIssue } from "@/lib/parseQuestions";

interface SubjectOption {
  id: string;
  name: string;
  grade: number;
}

interface ImportResult {
  created: number;
  skipped: number;
  issues: ParseIssue[];
}

const EXAMPLE = `question: Заңдылықты тауып, келесі санды жазыңыз: $1,\\ 4,\\ 9,\\ 16,\\ 25,\\ \\dots$
A) 30
B) 36*
C) 49
D) 35

question: $|x| = 7$ теңдеуінің шешімдері:
A) тек $7$
B) $7$ және $-7$*
C) тек $-7$
D) $0$`;

export function QuestionImport({ subjects }: { subjects: SubjectOption[] }) {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Тірі превью — серверге жібермей тұрып қанша сұрақ танылғанын көрсетеді
  const preview = useMemo(
    () => (content.trim() ? parseQuestions(content) : null),
    [content]
  );

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError("");
    setContent(await file.text());
  }

  async function handleImport() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Импорт қатесі");
      setResult({ created: data.created, skipped: data.skipped, issues: data.issues ?? [] });
      setContent("");
      setFileName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Қате шықты");
    } finally {
      setLoading(false);
    }
  }

  if (subjects.length === 0) return null;

  const validCount = preview?.questions.length ?? 0;
  const issueCount = preview?.issues.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px]">
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
            Файл (.tex / .txt)
          </label>
          <input
            type="file"
            accept=".tex,.txt,text/plain"
            onChange={handleFile}
            className="block text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-brand-700 hover:file:bg-brand-100"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowHelp((v) => !v)}
          className="ml-auto text-sm text-brand-600 hover:underline"
        >
          {showHelp ? "Форматты жасыру" : "Формат қандай болу керек?"}
        </button>
      </div>

      {showHelp && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          <ul className="mb-3 list-disc space-y-1 pl-5">
            <li>
              Жаңа сұрақ <code className="rounded bg-gray-200 px-1">question:</code> деп
              басталады (нөмірлеу міндетті емес).
            </li>
            <li>4 нұсқа: әрқайсысы бөлек жолда — A) B) C) D).</li>
            <li>
              Дұрыс жауаптың соңында <code className="rounded bg-gray-200 px-1">*</code>{" "}
              белгісі тұрады.
            </li>
            <li>Формулалар: $...$ (KaTeX). Бос жолдар мен % түсініктемелер еленбейді.</li>
          </ul>
          <pre className="overflow-x-auto rounded bg-white p-3 text-xs text-gray-700">
{EXAMPLE}
          </pre>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Мазмұн {fileName && <span className="text-gray-400">({fileName})</span>}
          <span className="font-normal text-gray-400"> — файл жүктеңіз немесе тікелей қойыңыз</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setResult(null);
          }}
          rows={10}
          placeholder={EXAMPLE}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>

      {/* Тірі превью */}
      {preview && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-700">
            ✓ {validCount} сұрақ дайын
          </span>
          {issueCount > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
              ⚠️ {issueCount} қате (импортталмайды)
            </span>
          )}
        </div>
      )}

      {preview && issueCount > 0 && (
        <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {preview.issues.map((i) => (
            <li key={i.index}>
              <b>#{i.index}</b> «{i.preview}…» — {i.reason}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleImport}
          disabled={loading || validCount === 0}
          className="rounded-lg bg-brand-500 px-5 py-2.5 font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {loading ? "Импортталуда..." : `${validCount} сұрақты импорттау`}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {/* Нәтиже */}
      {result && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          ✅ {result.created} сұрақ сәтті қосылды
          {result.skipped > 0 && `, ${result.skipped} қате сұрақ өткізіп жіберілді`}.
        </div>
      )}
    </div>
  );
}
