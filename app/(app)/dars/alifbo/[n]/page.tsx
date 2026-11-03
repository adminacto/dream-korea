"use client";
// Koreys alifbosi darsi — ТЗ bo'yicha qat'iy ketma-ketlik:
// ① video → ② jadval → ③ kartochka → ④ test (100%) → ⑤ natija.
// O'quvchi bosqichni tugatmasdan keyingisiga o'tolmaydi.
// Admin/Ustoz — "Tez o'tish" bilan istalgan bosqichni ochib ko'rishi mumkin.
import { useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { speak } from "@/lib/tts";
import { Volume2, Video, Table2, Layers, Puzzle, Lock, Check, ChevronRight, FastForward } from "lucide-react";
import { Flashcards } from "@/components/alifbo/flashcards";
import { MatchGame } from "@/components/alifbo/match-game";
import { SyllableLesson } from "@/components/alifbo/syllable-lesson";
import {
  ALIFBO_LESSONS,
  ALIFBO_STAGES,
  STAGE_LABELS,
  loadAlifbo,
  markAlifboStage,
  type AlifboStage,
} from "@/lib/alifbo";

export default function AlifboLessonPage() {
  const { n } = useParams<{ n: string }>();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (!mounted) return <p className="p-6 text-slate-500">Yuklanmoqda…</p>;
  return Number(n) === 4 ? <SyllableLesson /> : <AlphabetLesson key={n} no={Number(n)} />;
}

function subscribe() { return () => {}; }

function AlphabetLesson({ no }: { no: number }) {
  const lesson = ALIFBO_LESSONS.find((l) => l.no === no);
  const [stages, setStages] = useState<Partial<Record<AlifboStage, boolean>>>(() => loadAlifbo()[String(no)] ?? {});
  const [isStaff] = useState(() => {
    try {
      const role = (JSON.parse(localStorage.getItem("dk_user") || "{}") as { role?: string }).role;
      return role === "ADMIN";
    } catch { return false; }
  });

  if (!lesson) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <Link href="/dars" className="text-sm font-medium text-blue-600">← Darslar</Link>
        <Card className="p-8 text-center">
          <p className="font-semibold text-slate-700">Bunday alifbo darsi topilmadi</p>
          <Link href="/dars/alifbo/1" className="mt-2 inline-block font-semibold text-blue-600">1-darsdan boshlash →</Link>
        </Card>
      </div>
    );
  }

  function complete(stage: AlifboStage) {
    markAlifboStage(no, stage);
    setStages((s) => ({ ...s, [stage]: true }));
  }

  const activeStage = ALIFBO_STAGES.find((s) => !stages[s]) ?? "match";
  const allDone = ALIFBO_STAGES.every((s) => stages[s]);
  const next = ALIFBO_LESSONS.find((l) => l.no === no + 1);

  const stageMeta: Record<AlifboStage, { icon: typeof Video; ring: string; iconBg: string; num: string }> = {
    video: { icon: Video, ring: "ring-blue-100", iconBg: "bg-blue-50 text-blue-600", num: "①" },
    table: { icon: Table2, ring: "ring-violet-100", iconBg: "bg-violet-50 text-violet-600", num: "②" },
    cards: { icon: Layers, ring: "ring-amber-100", iconBg: "bg-amber-50 text-amber-600", num: "③" },
    match: { icon: Puzzle, ring: "ring-emerald-100", iconBg: "bg-emerald-50 text-emerald-600", num: "④" },
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 pb-16 sm:p-6">
      <Link href="/dars" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:gap-2 transition-all">← Darslar</Link>

      {/* Sarlavha */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#7c3aed] p-6 text-white shadow-lg shadow-blue-500/20 anim-fade-up">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">Koreys alifbosi · 한글</span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{no}-dars: {lesson.title} <span className="opacity-80">· {lesson.ko}</span></h1>
          <p className="mt-1 text-sm text-blue-100">{lesson.desc}</p>
        </div>
      </header>

      {/* Bosqichlar holati */}
      <div className="flex flex-wrap items-center gap-2">
        {ALIFBO_STAGES.map((s) => {
          const done = !!stages[s];
          const active = activeStage === s;
          return (
            <span
              key={s}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${done ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : active ? "bg-blue-50 text-blue-700 ring-blue-200" : "bg-slate-100 text-slate-400 ring-slate-200"}`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : active ? <ChevronRight className="h-3.5 w-3.5" /> : <Lock className="h-3 w-3" />}
              {STAGE_LABELS[s]}
            </span>
          );
        })}
        <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${allDone ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-400 ring-slate-200"}`}>
          {allDone ? <Check className="h-3.5 w-3.5" /> : <Lock className="h-3 w-3" />} ⑤ Natija
        </span>
      </div>

      {/* ① Video / instruksiya */}
      <StageCard stage="video" meta={stageMeta.video} stages={stages} activeStage={activeStage} label={`① Video dars`} isStaff={isStaff} onSkip={complete}>
        {lesson.videoUrl ? (
          <div className="space-y-3">
            <iframe title={`${lesson.title} — video dars`} src={lesson.videoUrl} className="aspect-video w-full rounded-xl" allowFullScreen />
            <Button onClick={() => complete("video")}>Video ko&apos;rib bo&apos;ldim</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">{lesson.instruction}</p>
            <p className="text-xs text-slate-400">Video dars keyinroq qo&apos;shiladi — hozir instruksiyani o&apos;qib chiqing.</p>
            <Button onClick={() => complete("video")}>Instruksiyani o&apos;qib bo&apos;ldim</Button>
          </div>
        )}
      </StageCard>

      {/* ② Harflar jadvali */}
      <StageCard stage="table" meta={stageMeta.table} stages={stages} activeStage={activeStage} label={`② ${lesson.tableTitle}`} isStaff={isStaff} onSkip={complete}>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Harflarni o&apos;qing, talaffuzni eshitish uchun harfga bosing. Esingizda qolmasa — «o&apos;qilishini ko&apos;rib» shu zaylda o&apos;rganing.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {lesson.cards.map((c) => (
              <button
                key={c.ko}
                type="button"
                onClick={() => speak(c.ko)}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-300 hover:shadow"
              >
                <span className="text-3xl font-bold text-slate-900">{c.ko}</span>
                <span className="flex items-center gap-2">
                  <span className="text-right text-xs font-medium text-slate-500">{c.uz}</span>
                  <Volume2 className="h-4 w-4 text-blue-500" />
                </span>
              </button>
            ))}
          </div>
          <Button onClick={() => complete("table")}>Jadvalni o&apos;qib chiqdim</Button>
        </div>
      </StageCard>

      {/* ③ Yodlash kartochkalari */}
      <StageCard stage="cards" meta={stageMeta.cards} stages={stages} activeStage={activeStage} label={`③ Yodlash kartochkalari`} isStaff={isStaff} onSkip={complete}>
        <Flashcards cards={lesson.cards} onDone={() => complete("cards")} />
      </StageCard>

      {/* ④ Moslashtirish testi */}
      <StageCard stage="match" meta={stageMeta.match} stages={stages} activeStage={activeStage} label={`④ Test — moslashtirish (100% shart)`} isStaff={isStaff} onSkip={complete}>
        <MatchGame cards={lesson.cards} onDone={() => complete("match")} />
      </StageCard>

      {/* ⑤ Natija */}
      {allDone ? (
        <Card className="space-y-3 border-0 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 ring-1 ring-emerald-200 anim-fade-up">
          <h2 className="text-xl font-bold text-emerald-700">🎉 {no}-dars yakunlandi!</h2>
          <p className="text-sm text-emerald-700">Barcha bosqichlar muvaffaqiyatli o&apos;tildi.</p>
          {next ? (
            <Link href={`/dars/alifbo/${next.no}`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 font-semibold text-white shadow-md shadow-blue-500/25 hover:gap-3 transition-all">
              Keyingi dars: {next.no}-dars · {next.title} <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <div className="space-y-2">
              <p className="font-semibold text-emerald-800">Alifbo kursi to&apos;liq yakunlandi — zo&apos;r natija!</p>
              <Link href="/dars" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 font-semibold text-white shadow-md shadow-blue-500/25 transition-all">
                Kitob mavzulariga o&apos;tish <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </Card>
      ) : (
        <Card className="border-0 p-5 ring-1 ring-slate-200">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Lock className="h-4 w-4" />
            ⑤ Natija — barcha bosqichlar (jumladan test 100%) tugagach ochiladi.
          </p>
        </Card>
      )}
    </div>
  );
}

// Bosqich kartochkasi: yakunlangan → yopiladi, faol → mazmuni, kelgusi → qulflangan
function StageCard({
  stage,
  meta,
  stages,
  activeStage,
  label,
  isStaff,
  onSkip,
  children,
}: {
  stage: AlifboStage;
  meta: { icon: typeof Video; ring: string; iconBg: string; num: string };
  stages: Partial<Record<AlifboStage, boolean>>;
  activeStage: AlifboStage;
  label: string;
  isStaff: boolean;
  onSkip: (s: AlifboStage) => void;
  children: React.ReactNode;
}) {
  const [reviewing, setReviewing] = useState(false);
  const Icon = meta.icon;
  const done = !!stages[stage];
  const locked = !done && activeStage !== stage;

  if (done && activeStage !== stage && !reviewing) {
    return (
      <Card className={`flex items-center gap-4 border-0 p-5 ring-1 ${meta.ring}`}>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${meta.iconBg}`}><Icon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-800">{label}</p>
          <p className="text-xs font-medium text-emerald-600">✓ Yakunlandi</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setReviewing(true)}>Qayta ko&apos;rish</Button>
      </Card>
    );
  }

  if (locked) {
    return (
      <Card className="flex items-center gap-4 border-0 p-5 ring-1 ring-slate-200 opacity-60">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Lock className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-600">{label}</p>
          <p className="text-xs text-slate-400">Avval oldingi bosqichlarni yakunlang</p>
        </div>
        {isStaff && <Button variant="ghost" size="sm" onClick={() => onSkip(stage)}><FastForward className="mr-1 h-3.5 w-3.5" /> Tez o&apos;tish</Button>}
      </Card>
    );
  }

  return (
    <Card className={`space-y-4 border-0 p-5 ring-1 ${meta.ring}`}>
      <h2 className="flex flex-wrap items-center gap-2 text-xl font-bold">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${meta.iconBg}`}><Icon className="h-4.5 w-4.5" /></span>
        {label}
        {done && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Yakunlandi</span>}
      </h2>
      {children}
    </Card>
  );
}
