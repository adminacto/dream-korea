"use client";
/* eslint-disable react/no-unescaped-entities */

// 4-dars: unli + undosh, bo'g'in yozish va 받침 (batchim).
// Savollar massiv ko'rinishida turadi — keyinchalik admin yangi mashqlarni
// shu shablon ichiga qo'shishi mumkin.
import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Lock, PenLine, Table2, Video, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { speak } from "@/lib/tts";
import { markAlifboStage } from "@/lib/alifbo";

type Stage = "video" | "combine" | "batchim" | "writing";
const STAGES: Stage[] = ["video", "combine", "batchim", "writing"];
const LABELS: Record<Stage, string> = {
  video: "Video dars",
  combine: "Bo'g'in tuzish",
  batchim: "받침 qoidasi",
  writing: "Yozish mashqi",
};

const COMBINE = [
  { formula: "ㄱ + ㅏ", answer: "가", read: "ga" },
  { formula: "ㄴ + ㅏ", answer: "나", read: "na" },
  { formula: "ㄷ + ㅏ", answer: "다", read: "da" },
  { formula: "ㄹ + ㅓ", answer: "러", read: "reo" },
  { formula: "ㅁ + ㅗ", answer: "모", read: "mo" },
];

const BATCHIM = [
  { formula: "ㅂ + ㅏ + ㅂ", answer: "밥", read: "bap" },
  { formula: "ㅁ + ㅜ + ㄴ", answer: "문", read: "mun" },
  { formula: "ㅇ + ㅏ + ㄴ", answer: "안", read: "an" },
  { formula: "ㅇ + ㅜ + ㅇ", answer: "웅", read: "ung" },
];

const WRITING = [
  { prompt: "Undosh + tik unli", hint: "ㄱ + ㅏ", answer: "가" },
  { prompt: "Tovushsiz undosh + yotiq unli", hint: "ㅇ + ㅗ", answer: "오" },
  { prompt: "Undosh + tik unli + 받침", hint: "ㅂ + ㅏ + ㅂ", answer: "밥" },
  { prompt: "Undosh + yotiq unli + 받침", hint: "ㅁ + ㅜ + ㄴ", answer: "문" },
  { prompt: "Tovushsiz undosh + tik unli + 받침", hint: "ㅇ + ㅏ + ㄴ", answer: "안" },
];

const KEY = "dk_alifbo_lesson4_v1";

function loadProgress(): Partial<Record<Stage, boolean>> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}

function saveProgress(p: Partial<Record<Stage, boolean>>) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export function SyllableLesson() {
  const [progress, setProgress] = useState<Partial<Record<Stage, boolean>>>(loadProgress);
  const [combine, setCombine] = useState<Record<number, string>>({});
  const [writing, setWriting] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [isStaff] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const u = JSON.parse(localStorage.getItem("dk_user") || "{}");
      return u.role === "ADMIN";
    } catch { return false; }
  });

  const active = useMemo(() => STAGES.find(s => !progress[s]) || "writing", [progress]);
  const complete = (stage: Stage) => {
    const next = { ...progress, [stage]: true };
    setProgress(next);
    saveProgress(next);
    markAlifboStage(4, ({ video: "video", combine: "table", batchim: "cards", writing: "match" } as const)[stage]);
  };
  const skip = (stage: Stage) => complete(stage);
  const check = (items: { answer: string }[], values: Record<number, string>, prefix: string) => {
    const results = Object.fromEntries(items.map((x, i) => [ `${prefix}${i}`, (values[i] || "").trim().normalize("NFC") === x.answer ]));
    setChecked(previous => ({ ...previous, ...results }));
    return Object.values(results).every(Boolean);
  };
  const feedback = (key: string) => checked[key] === true ? "border-emerald-400 bg-emerald-50" : checked[key] === false ? "border-red-400 bg-red-50" : "";
  const submitCombine = () => {
    if (check(COMBINE, combine, "c")) complete("combine");
  };
  const submitWriting = () => {
    if (check(WRITING, writing, "w")) complete("writing");
  };
  const allDone = STAGES.every(s => progress[s]);

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 pb-16 sm:p-6">
      <Link href="/dars" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600">← Darslar</Link>
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-purple-600 to-fuchsia-500 p-6 text-white shadow-lg shadow-violet-500/20">
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">Koreys alifbosi · 한글</span>
        <h1 className="mt-3 text-2xl font-extrabold">4-dars: Bo'g'in va so'z yozish</h1>
        <p className="mt-1 text-sm text-violet-100">Unli va undoshlarni qo'shib bo'g'in yozish hamda 받침 qoidasini o'rganamiz.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {STAGES.map(s => <span key={s} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${progress[s] ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : active === s ? "bg-violet-50 text-violet-700 ring-violet-200" : "bg-slate-100 text-slate-400 ring-slate-200"}`}><>{progress[s] ? <Check className="h-3.5 w-3.5" /> : <Lock className="h-3 w-3" />}</> {LABELS[s]}</span>)}
      </div>

      <LessonStage stage="video" active={active} done={!!progress.video} isStaff={isStaff} onSkip={skip} icon={<Video className="h-5 w-5" />} title="① Video dars">
        <p className="text-sm text-slate-600">Videoni ko'ring va instruksiyani o'qing. Bu bosqichda bo'g'in qanday tuzilishi va 받침 qayerga yozilishi tushuntiriladi.</p>
        <p className="text-xs text-slate-400">YouTube video admin tomonidan qo'shilganda shu joyda ko'rsatiladi.</p>
        <Button onClick={() => complete("video")}>Instruksiyani o'qib bo'ldim</Button>
      </LessonStage>

      <LessonStage stage="combine" active={active} done={!!progress.combine} isStaff={isStaff} onSkip={skip} icon={<Table2 className="h-5 w-5" />} title="② 2 harfni qo'shish">
        <p className="text-sm text-slate-600">Bo'sh kataklarga to'g'ri koreys bo'g'inini yozing. To'g'ri javob yashil, noto'g'ri javob qizil bo'ladi.</p>
        <div className="overflow-x-auto rounded-2xl border border-violet-100">
          <table className="w-full min-w-[430px] border-collapse text-sm">
            <thead><tr className="bg-violet-50"><th className="border p-2 text-left">Undosh + unli</th><th className="border p-2">Bo'g'in</th><th className="border p-2">O'qilishi</th></tr></thead>
            <tbody>{COMBINE.map((x, i) => <tr key={x.formula}>
              <td className="border p-2 font-semibold">{x.formula}</td>
              <td className="border p-2"><Input aria-label={`${x.formula} — bo'g'in`} aria-invalid={checked[`c${i}`] === false} value={combine[i] || ""} onChange={e => { setCombine(v => ({ ...v, [i]: e.target.value })); setChecked(v => { const next = { ...v }; delete next[`c${i}`]; return next; }); }} className={`text-center text-xl font-bold ${feedback(`c${i}`)}`} placeholder="?" /></td>
              <td className="border p-2 text-center text-slate-500">{x.read}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <Button onClick={submitCombine}>Tekshirish</Button>
      </LessonStage>

      <LessonStage stage="batchim" active={active} done={!!progress.batchim} isStaff={isStaff} onSkip={skip} icon={<Volume2 className="h-5 w-5" />} title="③ 받침 qoidasini o'rganish">
        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200"><b>받침</b> — bo'g'inning pastki qismiga yoziladigan undosh. U tik unli bilan ham, yotiq unli bilan ham kelishi mumkin.</div>
        <div className="grid gap-2 sm:grid-cols-2">{BATCHIM.map(x => <button key={x.answer} type="button" onClick={() => speak(x.answer)} className="flex items-center justify-between rounded-xl border bg-white p-3 text-left hover:border-violet-300"><span><b>{x.formula}</b><span className="mx-2 text-slate-400">→</span><b className="text-2xl text-violet-700">{x.answer}</b></span><span className="text-xs text-slate-500">{x.read} <Volume2 className="inline h-3.5 w-3.5" /></span></button>)}</div>
        <Button onClick={() => complete("batchim")}>Qoidani o'qib chiqdim</Button>
      </LessonStage>

      <LessonStage stage="writing" active={active} done={!!progress.writing} isStaff={isStaff} onSkip={skip} icon={<PenLine className="h-5 w-5" />} title="④ Yozish mashqi">
        <p className="text-sm text-slate-600">Jadvaldagi 5 ta mashqni bajaring. Keyinroq admin shu massivga yangi savollar qo'shishi mumkin.</p>
        <div className="space-y-3">{WRITING.map((x, i) => <div key={`${x.hint}-${i}`} className={`rounded-2xl border p-3 ${feedback(`w${i}`) || "border-slate-200 bg-white"}`}>
          <div className="flex items-center justify-between gap-2"><div><p className="text-xs font-semibold text-slate-500">{i + 1}. {x.prompt}</p><p className="mt-1 text-sm text-slate-700">{x.hint}</p></div><span className="text-2xl font-bold text-violet-700">{checked[`w${i}`] === true ? "✓" : checked[`w${i}`] === false ? "✗" : "□"}</span></div>
          <Input aria-label={`${i + 1}. ${x.hint}`} aria-invalid={checked[`w${i}`] === false} value={writing[i] || ""} onChange={e => { setWriting(v => ({ ...v, [i]: e.target.value })); setChecked(v => { const next = { ...v }; delete next[`w${i}`]; return next; }); }} placeholder="Bo'g'inni yozing" className="mt-2 text-lg font-bold" />
        </div>)}</div>
        <Button onClick={submitWriting}>Tekshirish va yakunlash</Button>
      </LessonStage>

      {allDone && <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 ring-1 ring-emerald-200"><h2 className="text-xl font-bold text-emerald-700">🎉 4-dars yakunlandi!</h2><p className="mt-1 text-sm text-emerald-700">Alifbo va yozish asoslari tugadi. Endi oraliq testni bajaring.</p><Link href="/dars/alifbo/imtihon" className="mt-3 inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white">ORALIQ TESTga o'tish <ChevronRight className="h-4 w-4" /></Link></Card>}
    </div>
  );
}

function LessonStage({ stage, active, done, isStaff, onSkip, icon, title, children }: { stage: Stage; active: Stage; done: boolean; isStaff: boolean; onSkip: (stage: Stage) => void; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const [reviewing, setReviewing] = useState(false);
  if (!done && active !== stage) return <Card className="flex items-center gap-3 border-0 p-5 opacity-60 ring-1 ring-slate-200"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-400"><Lock className="h-5 w-5" /></span><div className="flex-1"><p className="font-bold text-slate-600">{title}</p><p className="text-xs text-slate-400">Avval oldingi bosqichni yakunlang</p></div>{isStaff && <Button size="sm" variant="ghost" onClick={() => onSkip(stage)}>Admin: o'tish</Button>}</Card>;
  if (done && !reviewing) return <Card className="flex items-center gap-3 border-0 p-5 ring-1 ring-emerald-100"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Check className="h-5 w-5" /></span><div className="flex-1"><p className="font-bold text-slate-800">{title}</p><p className="text-xs text-emerald-600">Yakunlandi</p></div><Button size="sm" variant="outline" onClick={() => setReviewing(true)}>Qayta ko'rish</Button></Card>;
  return <Card className="space-y-4 border-0 p-5 ring-1 ring-violet-100"><h2 className="flex items-center gap-2 text-xl font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600">{icon}</span>{title}</h2>{children}</Card>;
}
