// Koreys alifbosi (한글) kursi — buyurtmachi ТЗ (docs/spec-online-platforma.docx):
// 1-dars oddiy unlilar, 2-dars murakkab unlilar, 3-dars undoshlar.
// Har bir dars 5 bosqich: ① video → ② harflar jadvali → ③ yodlash kartochkalari
// → ④ moslashtirish testi (drag-and-drop) → ⑤ natija (100% sharti).

export type AlifboCard = { ko: string; uz: string; note?: string };

export type AlifboLesson = {
  no: number;
  title: string;
  ko: string;
  desc: string;
  // Video hali admin tomonidan qo'shilmagan — bosqich instruksiyani ko'rsatadi
  videoUrl?: string;
  instruction: string;
  tableTitle: string;
  cards: AlifboCard[];
};

export const ALIFBO_LESSONS: AlifboLesson[] = [
  {
    no: 1,
    title: "Oddiy unlilar",
    ko: "모음",
    desc: "Koreys alifbosining 10 ta oddiy unlisini o'rganamiz. Har bir harfning o'qilishi va talaffuzini yodlab olamiz.",
    instruction:
      "1-bosqich: videodagi darsni to'liq ko'ring va instruksiya bilan tanishing. Keyingi bosqichga o'tish uchun videoni ko'rib bo'lganingizni tasdiqlang.",
    tableTitle: "10 ta oddiy unli",
    cards: [
      { ko: "ㅏ", uz: "a" },
      { ko: "ㅑ", uz: "ya" },
      { ko: "ㅓ", uz: "eo (e dan qalinroq)" },
      { ko: "ㅕ", uz: "yeo (yo dan qalinroq)" },
      { ko: "ㅗ", uz: "o" },
      { ko: "ㅛ", uz: "yo" },
      { ko: "ㅜ", uz: "u" },
      { ko: "ㅠ", uz: "yu" },
      { ko: "ㅡ", uz: "eu (Ы ga yaqin)" },
      { ko: "ㅣ", uz: "i" },
    ],
  },
  {
    no: 2,
    title: "Murakkab unlilar",
    ko: "이중모음",
    desc: "Oddiy unlilarning qo'shilishidan hosil bo'lgan 11 ta murakkab unlini o'rganamiz. Bosqichlar 1-dars bilan bir xil.",
    instruction:
      "1-bosqich: videodagi darsni to'liq ko'ring. Murakkab unlilar oddiy unlilarning juftligidan tashkil topadi — e'tibor bilan tinglang.",
    tableTitle: "11 ta murakkab unli",
    cards: [
      { ko: "ㅐ", uz: "ae (a va e orasida)" },
      { ko: "ㅒ", uz: "yae" },
      { ko: "ㅔ", uz: "e" },
      { ko: "ㅖ", uz: "ye" },
      { ko: "ㅘ", uz: "wa (ㅗ+ㅏ)" },
      { ko: "ㅙ", uz: "wae (ㅗ+ㅐ)" },
      { ko: "ㅚ", uz: "oe (ㅗ+ㅣ)" },
      { ko: "ㅝ", uz: "wo (ㅜ+ㅓ)" },
      { ko: "ㅞ", uz: "we (ㅜ+ㅔ)" },
      { ko: "ㅟ", uz: "wi (ㅜ+ㅣ)" },
      { ko: "ㅢ", uz: "ui (ㅡ+ㅣ)" },
    ],
  },
  {
    no: 3,
    title: "Undoshlar",
    ko: "자음",
    desc: "14 ta asosiy va 5 ta taroq (kuchli) undoshni o'rganamiz. Bosqichlar 1-dars bilan bir xil.",
    instruction:
      "1-bosqich: videodagi darsni to'liq ko'ring. Koreys undoshlari tovushga qarab juftlashgan (kuchli/kuchsiz) — talaffuzga e'tibor bering.",
    tableTitle: "19 ta undosh",
    cards: [
      { ko: "ㄱ", uz: "g / k" },
      { ko: "ㄴ", uz: "n" },
      { ko: "ㄷ", uz: "d / t" },
      { ko: "ㄹ", uz: "r / l" },
      { ko: "ㅁ", uz: "m" },
      { ko: "ㅂ", uz: "b / p" },
      { ko: "ㅅ", uz: "s" },
      { ko: "ㅇ", uz: "ng (boshda jim)" },
      { ko: "ㅈ", uz: "j" },
      { ko: "ㅊ", uz: "ch (nefisli)" },
      { ko: "ㅋ", uz: "k (nefisli)" },
      { ko: "ㅌ", uz: "t (nefisli)" },
      { ko: "ㅍ", uz: "p (nefisli)" },
      { ko: "ㅎ", uz: "h" },
      { ko: "ㄲ", uz: "kk (taroq)" },
      { ko: "ㄸ", uz: "tt (taroq)" },
      { ko: "ㅃ", uz: "pp (taroq)" },
      { ko: "ㅆ", uz: "ss (taroq)" },
      { ko: "ㅉ", uz: "jj (taroq)" },
    ],
  },
];

ALIFBO_LESSONS.push({
  no: 4,
  title: "Bo'g'in va so'z yozish",
  ko: "받침",
  desc: "Bo'g'in tuzish va 받침 qoidasini o'rganish.",
  instruction: "Video darsni ko'ring.",
  tableTitle: "Bo'g'inlar jadvali",
  cards: [],
});

// Progress — localStorage (boshqa darslar singari klient tomonida).
const KEY = "dk_alifbo_v1";

export type AlifboStage = "video" | "table" | "cards" | "match";
export const ALIFBO_STAGES: AlifboStage[] = ["video", "table", "cards", "match"];
export const STAGE_LABELS: Record<AlifboStage, string> = {
  video: "Video",
  table: "Harflar jadvali",
  cards: "Yodlash kartochkalari",
  match: "Moslashtirish testi",
};

export type AlifboProgress = Record<string, Partial<Record<AlifboStage, boolean>>>;

export function loadAlifbo(): AlifboProgress {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as AlifboProgress;
  } catch {
    return {};
  }
}

export function markAlifboStage(no: number, stage: AlifboStage) {
  if (typeof window === "undefined") return;
  const p = loadAlifbo();
  p[String(no)] = { ...p[String(no)], [stage]: true };
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export function resetAlifboLesson(no: number) {
  if (typeof window === "undefined") return;
  const p = loadAlifbo();
  delete p[String(no)];
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export function alifboLessonDone(p: AlifboProgress, no: number): boolean {
  const row = p[String(no)];
  return !!row && ALIFBO_STAGES.every((s) => row[s]);
}

export function alifboDoneCount(p: AlifboProgress): number {
  return ALIFBO_LESSONS.filter((l) => alifboLessonDone(p, l.no)).length;
}

// Keyingi ochilmagan dars raqami (hammasi tugagan bo'lsa null)
export function nextAlifboLesson(p: AlifboProgress): number | null {
  for (const l of ALIFBO_LESSONS) {
    if (!alifboLessonDone(p, l.no)) return l.no;
  }
  return null;
}
