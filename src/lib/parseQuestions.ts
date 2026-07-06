// ─────────────────────────────────────────────────────────────
//  .tex / мәтін файлынан сұрақтарды талдау (парсер)
//
//  Формат ережелері:
//   • Жаңа сұрақ `question:` (немесе `сұрақ:`) деп басталады.
//   • Сұрақты нөмірлеу міндетті емес ("1. question:" де жарайды).
//   • 4 нұсқа: әрқайсысы бір әріп + ) немесе . (A) B) C) D) немесе А) В) С) Д)).
//   • Дұрыс жауаптың соңында * белгісі тұрады.
//   • Нұсқалар РЕТІ бойынша A,B,C,D-ға тағайындалады (әріп таңбасы емес, орны маңызды).
//   • Бос жолдар, % түсініктемелер және \... LaTeX командалары еленбейді.
//
//  Мысал:
//   question: $|x| = 7$ теңдеуінің шешімдері:
//   A) тек $7$
//   B) $7$ және $-7$*
//   C) тек $-7$
//   D) $0$
// ─────────────────────────────────────────────────────────────

export interface ParsedQuestion {
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctKey: "A" | "B" | "C" | "D";
}

export interface ParseIssue {
  index: number; // нешінші сұрақ блогы (1-ден бастап)
  preview: string; // сұрақ мәтінінің басы
  reason: string; // не себепті қабылданбады
}

export interface ParseResult {
  questions: ParsedQuestion[];
  issues: ParseIssue[];
}

interface RawBlock {
  text: string;
  options: { text: string; correct: boolean }[];
}

const QUESTION_RE = /^\s*(?:\d+[.)]\s*)?(?:question|сұрақ)\s*:\s*(.*)$/i;
const OPTION_RE = /^\s*([A-Za-zА-Яа-яҚқҰұ])\s*[.)]\s*(.+?)\s*$/;

const KEYS = ["A", "B", "C", "D"] as const;

export function parseQuestions(content: string): ParseResult {
  const lines = content.split(/\r?\n/);
  const blocks: RawBlock[] = [];
  let current: RawBlock | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue; // бос жол
    if (line.startsWith("%")) continue; // LaTeX түсініктеме

    // Жаңа сұрақ басы
    const qMatch = line.match(QUESTION_RE);
    if (qMatch) {
      if (current) blocks.push(current);
      current = { text: qMatch[1].trim(), options: [] };
      continue;
    }

    if (!current) continue; // алғашқы question:-ге дейінгінің бәрі еленбейді

    // Нұсқа жолы
    const oMatch = current.options.length < 4 ? line.match(OPTION_RE) : null;
    if (oMatch) {
      current.options.push(makeOption(oMatch[2]));
      continue;
    }

    // LaTeX құрылымдық командалары (\begin, \end, \documentclass, ...) — еленбейді
    if (line.startsWith("\\")) continue;

    // Жалғасы: нұсқа әлі басталмаса — көп жолды сұрақ мәтіні;
    // әйтпесе соңғы нұсқаның жалғасы (көп жолды нұсқа)
    if (current.options.length === 0) {
      current.text = current.text ? `${current.text} ${line}` : line;
    } else {
      const last = current.options[current.options.length - 1];
      let cont = line;
      if (cont.endsWith("*")) {
        last.correct = true;
        cont = cont.slice(0, -1).trim();
      }
      last.text = `${last.text} ${cont}`.trim();
    }
  }
  if (current) blocks.push(current);

  // ── Валидация ──
  const questions: ParsedQuestion[] = [];
  const issues: ParseIssue[] = [];

  blocks.forEach((b, i) => {
    const index = i + 1;
    const preview = (b.text || "(мәтінсіз)").slice(0, 70);

    if (!b.text.trim()) {
      issues.push({ index, preview, reason: "сұрақ мәтіні бос" });
      return;
    }
    if (b.options.length !== 4) {
      issues.push({
        index,
        preview,
        reason: `4 нұсқа керек, ал ${b.options.length} табылды`,
      });
      return;
    }
    if (b.options.some((o) => !o.text.trim())) {
      issues.push({ index, preview, reason: "бос нұсқа бар" });
      return;
    }
    const correctCount = b.options.filter((o) => o.correct).length;
    if (correctCount !== 1) {
      issues.push({
        index,
        preview,
        reason:
          correctCount === 0
            ? "дұрыс жауап белгіленбеген (* қою керек)"
            : "бірден көп дұрыс жауап белгіленген (*)",
      });
      return;
    }

    const correctIdx = b.options.findIndex((o) => o.correct);
    questions.push({
      text: b.text.trim(),
      optionA: b.options[0].text,
      optionB: b.options[1].text,
      optionC: b.options[2].text,
      optionD: b.options[3].text,
      correctKey: KEYS[correctIdx],
    });
  });

  return { questions, issues };
}

// Нұсқа мәтінін тазарту + соңындағы * (дұрыс жауап) белгісін анықтау
function makeOption(raw: string): { text: string; correct: boolean } {
  let text = raw.trim();
  const correct = text.endsWith("*");
  if (correct) text = text.slice(0, -1).trim();
  return { text, correct };
}
