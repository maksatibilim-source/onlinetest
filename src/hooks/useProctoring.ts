"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseProctoringOptions {
  /** Бақылауды қосу/өшіру (тест басталғанда true) */
  enabled?: boolean;
  /** Қосарланған event-терді елемеу үшін «суыну» уақыты (мс) */
  cooldownMs?: number;
  /** Әр ереже бұзу тіркелгенде шақырылады (жалпы санды жібереді) */
  onViolation?: (total: number) => void | Promise<void>;
}

interface ProctoringState {
  /** Тіркелген ереже бұзу саны */
  violations: number;
  /** Ескерту көрінуі керек пе */
  showWarning: boolean;
  /** Ескертуді жабу */
  dismissWarning: () => void;
  /** Соңғы бұзу себебі (blur | visibilitychange) — қаласаңыз көрсету үшін */
  lastReason: string | null;
}

/**
 * Жеңіл прокторинг hook-ы.
 * Оқушы басқа вкладкаға ауысса (visibilitychange → document.hidden) немесе
 * терезеден фокус кетсе / кішірейтсе (window blur) — ереже бұзу деп тіркейді.
 *
 * blur мен visibilitychange көбіне қатар атылады, сондықтан cooldown арқылы
 * бір ауысу = бір бұзу болатындай дебаунс жасалған.
 */
export function useProctoring({
  enabled = true,
  cooldownMs = 1000,
  onViolation,
}: UseProctoringOptions = {}): ProctoringState {
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [lastReason, setLastReason] = useState<string | null>(null);

  const lastAtRef = useRef(0);
  const onViolationRef = useRef(onViolation);

  // callback-ты ref-те ұстаймыз — event listener-ды қайта тіркемей, әрдайым жаңасын шақырады
  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  const register = useCallback(
    (reason: string) => {
      const now = Date.now();
      if (now - lastAtRef.current < cooldownMs) return; // дебаунс
      lastAtRef.current = now;

      setViolations((prev) => {
        const next = prev + 1;
        void onViolationRef.current?.(next); // API-ге жіберу
        return next;
      });
      setLastReason(reason);
      setShowWarning(true);
    },
    [cooldownMs]
  );

  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.hidden) register("visibilitychange"); // вкладка ауысты / жасырылды
    };
    const handleBlur = () => register("blur"); // терезеден фокус кетті / кішірейді

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [enabled, register]);

  const dismissWarning = useCallback(() => setShowWarning(false), []);

  return { violations, showWarning, dismissWarning, lastReason };
}
