"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join("");

  function setDigit(i: number, val: string) {
    const v = val.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (v && i < 3) inputsRef.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!text) return;
    e.preventDefault();
    const next = ["", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    inputsRef.current[Math.min(text.length, 3)]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 4) {
      setError("4 таңбалы кодты толық енгізіңіз");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/codes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Код қате немесе жарамсыз");

      sessionStorage.setItem("ot_codeId", data.codeId);
      if (data.grade) sessionStorage.setItem("ot_grade", String(data.grade));
      router.push("/questionnaire");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Қате шықты");
      setDigits(["", "", "", ""]);
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-2xl text-white">
          📝
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Қабылдау емтиханы</h1>
        <p className="mt-2 text-sm text-gray-500">
          Мұғалім берген 4 таңбалы бір реттік кодты енгізіңіз
        </p>

        <div className="mt-6 flex justify-center gap-3" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              autoFocus={i === 0}
              className="h-16 w-14 rounded-xl border-2 border-gray-200 text-center text-3xl font-bold text-gray-900 focus:border-brand-500 focus:outline-none"
            />
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-brand-500 py-3 font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {loading ? "Тексерілуде..." : "Кіру"}
        </button>
      </form>

      {/* Көзге түспейтін «Админ панельге өту» батырмасы (оң төменгі бұрыш) */}
      <Link
        href="/admin/login"
        className="fixed bottom-3 right-4 text-xs text-gray-300 transition hover:text-gray-500"
      >
        Админ панель
      </Link>
    </main>
  );
}
