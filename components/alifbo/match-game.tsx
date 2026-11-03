"use client";
// ТЗ 4-bosqich: moslashtirish testi — chapdagi koreys harfini o'ngdagi o'zbek
// o'qilishiga sudrab (yoki bosib tanlab) qo'yish. To'g'ri — yashil, xato — qizil
// va qabul qilinmaydi. Keyingi darsga o'tish uchun 100% to'g'ri bo'lishi shart.
import { useRef, useState } from "react";
import { RotateCcw, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playWin } from "@/lib/win-sound";
import type { AlifboCard } from "@/lib/alifbo";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Drag = { ko: string; x: number; y: number };

export function MatchGame({ cards, onDone }: { cards: AlifboCard[]; onDone: () => void }) {
  const [left, setLeft] = useState(() => shuffle(cards.map(c => c.ko)));
  const [right, setRight] = useState(() => shuffle(cards.map(c => c.uz)));

  const [matched, setMatched] = useState<string[]>([]); // ko lar
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongUz, setWrongUz] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [errors, setErrors] = useState(0);
  const start = useRef<{ x: number; y: number; ko: string } | null>(null);

  const total = cards.length;
  const done = matched.length === total;
  const koOf = (uz: string) => cards.find((c) => c.uz === uz)?.ko;
  const uzOf = (ko: string) => cards.find((c) => c.ko === ko)?.uz;

  function attempt(ko: string, uz: string) {
    if (matched.includes(ko)) return;
    if (uzOf(ko) === uz) {
      const next = [...matched, ko];
      setMatched(next);
      setSelected(null);
      if (next.length === total) {
        playWin();
        onDone();
      }
    } else {
      setWrongUz(uz);
      setErrors((e) => e + 1);
      setSelected(null);
      setTimeout(() => setWrongUz((w) => (w === uz ? null : w)), 700);
    }
  }

  function restart() {
    setLeft(shuffle(cards.map(c => c.ko)));
    setRight(shuffle(cards.map(c => c.uz)));
    setMatched([]);
    setSelected(null);
    setWrongUz(null);
    setErrors(0);
  }

  // Pointer-based drag (mobil sensor va sichqoncha uchun) + bosib tanlash
  function onChipDown(e: React.PointerEvent, ko: string) {
    start.current = { x: e.clientX, y: e.clientY, ko };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onChipMove(e: React.PointerEvent) {
    if (!start.current) return;
    const dx = Math.abs(e.clientX - start.current.x);
    const dy = Math.abs(e.clientY - start.current.y);
    if (dx > 6 || dy > 6) setDrag({ ko: start.current.ko, x: e.clientX, y: e.clientY });
  }
  function onChipUp(e: React.PointerEvent) {
    const s = start.current;
    start.current = null;
    if (!s) return;
    if (drag) {
      // sudrab qo'yish — kursor ostidagi slotni topamiz
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const slot = el?.closest("[data-uz]") as HTMLElement | null;
      setDrag(null);
      if (slot?.dataset.uz) attempt(s.ko, slot.dataset.uz);
      else setSelected(null);
    } else {
      // oddiy bosish — tanlash/bekor qilish
      setSelected((cur) => (cur === s.ko ? null : s.ko));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="font-medium text-slate-600">
          Moslashtirildi: <b className={done ? "text-emerald-600" : "text-blue-600"}>{matched.length}/{total}</b>
          {errors > 0 && <span className="ml-2 text-red-500">· xato: {errors}</span>}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={restart}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Boshidan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {/* Chap ustun — koreys harflari */}
        <div className="flex flex-col gap-2.5" aria-label="Koreys harflari">
          {left.map((ko) => {
            const isMatched = matched.includes(ko);
            const isSel = selected === ko;
            const isDragging = drag?.ko === ko;
            return (
              <button
                key={ko}
                type="button"
                disabled={isMatched}
                data-ko={ko}
                onPointerDown={(e) => !isMatched && onChipDown(e, ko)}
                onPointerMove={onChipMove}
                onPointerUp={onChipUp}
                onPointerCancel={() => { start.current = null; setDrag(null); }}
                className={[
                  "rounded-2xl border-2 py-3 text-center text-4xl font-bold transition-all",
                  isMatched
                    ? "border-emerald-200 bg-emerald-50/60 text-emerald-300 opacity-60"
                    : isSel
                      ? "border-blue-500 bg-blue-50 text-slate-900 shadow-md shadow-blue-200"
                      : "border-slate-200 bg-white text-slate-900 shadow-sm hover:border-blue-300",
                  isDragging ? "opacity-30" : "",
                  !isMatched ? "cursor-grab touch-none active:cursor-grabbing" : "",
                ].join(" ")}
              >
                {ko}
              </button>
            );
          })}
        </div>

        {/* O'ng ustun — o'zbek o'qilishlari (slotlar) */}
        <div className="flex flex-col gap-2.5" aria-label="O'zbek o'qilishlari">
          {right.map((uz) => {
            const ko = koOf(uz);
            const isFilled = ko ? matched.includes(ko) : false;
            const isWrong = wrongUz === uz;
            const isTarget = drag && ko && !matched.includes(ko);
            return (
              <button
                key={uz}
                type="button"
                data-uz={uz}
                disabled={isFilled}
                onClick={() => selected && ko && attempt(selected, uz)}
                className={[
                  "rounded-2xl border-2 py-3 px-3 text-center text-sm font-semibold transition-all sm:text-base",
                  isFilled
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                    : isWrong
                      ? "animate-pulse border-red-400 bg-red-50 text-red-600"
                      : "border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-blue-400",
                  isTarget && !isFilled && !isWrong ? "border-blue-400 bg-blue-50/50" : "",
                ].join(" ")}
              >
                {isFilled && ko ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold text-emerald-700">{ko}</span>
                    <span>✓</span>
                  </span>
                ) : (
                  uz
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sudrab ketayotgan "arvoh" harf */}
      {drag && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rotate-3 rounded-2xl border-2 border-blue-500 bg-white px-5 py-2.5 text-4xl font-bold text-slate-900 shadow-xl"
          style={{ left: drag.x, top: drag.y }}
        >
          {drag.ko}
        </div>
      )}

      <p className="flex items-start gap-1.5 text-xs text-slate-500">
        <MousePointerClick className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Harfni ushlab olib o&apos;qilishiga sudrab qo&apos;ying — yoki avval harfni, keyin o&apos;qilishni bosing. To&apos;g&apos;ri javob yashil, xato qizil bo&apos;ladi va qabul qilinmaydi. Keyingi darsga o&apos;tish uchun 100% to&apos;g&apos;ri kerak.
      </p>

      {done && (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 text-center ring-1 ring-emerald-200">
          <p className="text-lg font-bold text-emerald-700">🎉 {total}/{total} — 100% to&apos;g&apos;ri!</p>
          <p className="mt-1 text-sm text-emerald-600">Sinov muvaffaqiyatli yakunlandi.</p>
        </div>
      )}
    </div>
  );
}
