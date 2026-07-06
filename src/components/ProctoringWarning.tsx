"use client";

interface ProctoringWarningProps {
  count: number;
  onClose: () => void;
}

/** Ереже бұзу тіркелгенде экранға шығатын ескерту модалі */
export function ProctoringWarning({ count, onClose }: ProctoringWarningProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-3xl">
          ⚠️
        </div>
        <h2 className="text-lg font-bold text-red-600">Ереже бұзушылық тіркелді!</h2>
        <p className="mt-2 text-sm text-gray-600">
          Тест кезінде басқа вкладкаға ауысуға немесе терезені кішірейтуге болмайды.
          Бұл әрекет автоматты түрде тіркеліп отырады.
        </p>
        <p className="mt-3 text-sm font-semibold text-gray-800">
          Барлық ескерту саны:{" "}
          <span className="text-red-600">{count}</span>
        </p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-brand-500 px-4 py-2.5 font-medium text-white transition hover:bg-brand-600"
        >
          Түсіндім, тестке ораламын
        </button>
      </div>
    </div>
  );
}
