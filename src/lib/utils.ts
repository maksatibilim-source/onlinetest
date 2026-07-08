// Ортақ көмекші функциялар мен тұрақтылар

// Fisher–Yates араластыру — сұрақтар мен жауап нұсқаларын кездейсоқ реттеу үшін
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 4 таңбалы кездейсоқ код (1000–9999)
export function generate4DigitCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export const GRADES = [5, 6, 7, 8, 9] as const;
export type Grade = (typeof GRADES)[number];

// Әр пән тестінде шығатын сұрақтың ең көп саны (кездейсоқ таңдалады)
export const QUESTIONS_PER_SUBJECT = 20;

// Дерекқордағы кілттер
export const OPTION_KEYS = ["A", "B", "C", "D"] as const;
export type OptionKey = (typeof OPTION_KEYS)[number];

// Экранда көрсетілетін таңбалар (А, В, С, Д)
export const OPTION_LABELS = ["А", "В", "С", "Д"] as const;
