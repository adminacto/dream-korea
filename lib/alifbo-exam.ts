import { ALIFBO_LESSONS, alifboDoneCount, type AlifboProgress } from "@/lib/alifbo";

export type AlifboExamQuestion = { text: string; options: string[]; answer: string };

// Questions cover all four topics; new questions can use the same structure.
export function alifboExamQuestions(): AlifboExamQuestion[] {
  const letters = ALIFBO_LESSONS.slice(0, 3).flatMap(lesson =>
    lesson.cards.filter((_, i) => i % 3 === 0).map(card => ({
      text: `${card.ko} — o‘qilishini tanlang`,
      options: [card.uz, ...lesson.cards.filter(c => c.ko !== card.ko).slice(0, 3).map(c => c.uz)],
      answer: card.uz,
    })),
  );
  return [...letters,
    { text: "ㄱ + ㅏ = ?", options: ["가", "고", "나", "각"], answer: "가" },
    { text: "ㅁ + ㅜ + ㄴ = ?", options: ["무", "문", "눈", "물"], answer: "문" },
    { text: "밥 — 받침 qaysi harf?", options: ["ㅏ", "ㅂ (pastdagi)", "ㅇ", "받침 yo‘q"], answer: "ㅂ (pastdagi)" },
    { text: "받침 qayerga yoziladi?", options: ["Bo‘g‘inning pastiga", "Bo‘g‘inning tepasiga", "Alohida satrga", "Faqat so‘z boshiga"], answer: "Bo‘g‘inning pastiga" },
  ];
}

const KEY = "dk_alifbo_exam_v1";
export type AlifboExamResult = { score: number; total: number; attempts: number };

export function thematicLessonsUnlocked(progress: AlifboProgress, exam: AlifboExamResult | null): boolean {
  return alifboDoneCount(progress) === ALIFBO_LESSONS.length && exam !== null;
}

export function loadAlifboExam(): AlifboExamResult | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!value || !Number.isInteger(value.score) || !Number.isInteger(value.total) ||
      value.total <= 0 || value.score < 0 || value.score > value.total ||
      !Number.isInteger(value.attempts) || value.attempts < 1) return null;
    return value;
  } catch { return null; }
}

export function saveAlifboExam(score: number, total: number): AlifboExamResult {
  const previous = loadAlifboExam();
  const result = { score, total, attempts: (previous?.attempts ?? 0) + 1 };
  try { localStorage.setItem(KEY, JSON.stringify(result)); } catch {}
  return result;
}
