"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { alifboDoneCount, loadAlifbo, nextAlifboLesson } from "@/lib/alifbo";
import { alifboExamQuestions, loadAlifboExam, saveAlifboExam, type AlifboExamResult } from "@/lib/alifbo-exam";

const subscribe = () => () => {};

function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function AlifboExamPage() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (!mounted) return <p className="p-6 text-slate-500">Yuklanmoqda…</p>;
  return <ExamAccess />;
}

function ExamAccess() {
  const progress = loadAlifbo();
  let admin = false;
  try { admin = JSON.parse(localStorage.getItem("dk_user") || "{}").role === "ADMIN"; } catch {}
  if (!admin && alifboDoneCount(progress) < 4) return (
    <Card className="mx-auto my-6 max-w-3xl space-y-3 p-6 text-center">
      <h1 className="text-xl font-bold">ORALIQ TEST hali yopiq</h1>
      <p>Avval alifboning barcha 4 ta darsini yakunlang.</p>
      <Link className="inline-block font-semibold text-blue-600" href={`/dars/alifbo/${nextAlifboLesson(progress) ?? 1}`}>Darsni davom ettirish →</Link>
    </Card>
  );
  return <Exam />;
}

function Exam() {
  const [questions, setQuestions] = useState(() => shuffle(alifboExamQuestions()).map(q => ({ ...q, options: shuffle(q.options) })));
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<AlifboExamResult | null>(null);
  const [previous, setPrevious] = useState(loadAlifboExam);
  const answered = Object.keys(answers).length;

  function submit() {
    if (result || answered !== questions.length) return;
    const score = questions.filter((q, i) => answers[i] === q.answer).length;
    const saved = saveAlifboExam(score, questions.length);
    setResult(saved);
    setPrevious(saved);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restart() {
    setQuestions(shuffle(alifboExamQuestions()).map(q => ({ ...q, options: shuffle(q.options) })));
    setAnswers({});
    setResult(null);
  }

  return <div className="mx-auto max-w-3xl space-y-5 p-4 pb-16 sm:p-6">
    <Link href="/dars" className="font-semibold text-blue-600">← Darslar</Link>
    <header className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white">
      <p className="text-sm font-semibold">Koreys alifbosi · 1–4-dars</p>
      <h1 className="mt-2 text-2xl font-extrabold">ORALIQ TEST</h1>
      <p className="mt-2 text-sm">Unlilar, undoshlar, bo‘g‘in va 받침 · {questions.length} savol</p>
    </header>
    {previous && !result && <p className="text-sm text-slate-600">Oxirgi natija: {previous.score}/{previous.total} · Urinishlar: {previous.attempts}</p>}
    {result && <Card className="space-y-3 p-6 text-center" role="status">
      <h2 className="text-xl font-bold">Natija: {result.score}/{result.total} — {Math.round(result.score / result.total * 100)}%</h2>
      <p className="text-sm text-slate-600">Quyida javoblaringizni tekshiring. Xatolar bo‘lsa, darslarni takrorlab yana urinib ko‘ring.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={restart}>Qayta topshirish</Button>
        <Link href="/dars" className="rounded-full border px-5 py-2 font-semibold text-blue-600">Mavzuli darslarga o‘tish →</Link>
      </div>
    </Card>}
    {questions.map((q, i) => <Card key={i} className={`space-y-3 p-4 ${result ? answers[i] === q.answer ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50" : ""}`}>
      <fieldset disabled={!!result}>
        <legend className="mb-3 font-semibold">{i + 1}. {q.text}</legend>
        <div className="grid gap-2 sm:grid-cols-2">{q.options.map(option => <label key={option} className={`cursor-pointer rounded-xl border p-3 text-sm ${answers[i] === option ? "border-blue-500 bg-blue-50" : "bg-white"}`}>
          <input type="radio" className="mr-2" name={`alifbo-q${i}`} checked={answers[i] === option} onChange={() => setAnswers(a => ({ ...a, [i]: option }))} />{option}
        </label>)}</div>
      </fieldset>
      {result && <p className="text-sm font-semibold">{answers[i] === q.answer ? "✓ To‘g‘ri" : `✗ To‘g‘ri javob: ${q.answer}`}</p>}
    </Card>)}
    {!result && <div className="sticky bottom-3 flex items-center justify-between gap-3 rounded-2xl bg-white/95 p-3 shadow-lg">
      <p className="text-sm">{answered}/{questions.length} javob berildi</p>
      <Button disabled={answered !== questions.length} onClick={submit}>Tekshirish</Button>
    </div>}
  </div>;
}
