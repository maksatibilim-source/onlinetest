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

// Мұғалім біліктілік тесті — арнайы "деңгей" (grade = 0)
export const TEACHER_GRADE = 0;

// Барлық деңгейлер (селектілер үшін): 5–9 сыныптар + Мұғалім
export const LEVELS = [...GRADES, TEACHER_GRADE] as const;

// Деңгейдің көрінетін атауы
export function levelLabel(grade: number | null | undefined): string {
  if (grade === TEACHER_GRADE) return "Мұғалім";
  if (grade === null || grade === undefined) return "Барлығы";
  return `${grade}-сынып`;
}

export function isTeacherGrade(grade: number | null | undefined): boolean {
  return grade === TEACHER_GRADE;
}

// Әр пән тестінде шығатын сұрақтың ең көп саны (кездейсоқ таңдалады)
export const QUESTIONS_PER_SUBJECT = 20;

// Дерекқордағы кілттер
export const OPTION_KEYS = ["A", "B", "C", "D"] as const;
export type OptionKey = (typeof OPTION_KEYS)[number];

// Экранда көрсетілетін таңбалар (А, В, С, Д)
export const OPTION_LABELS = ["А", "В", "С", "Д"] as const;
