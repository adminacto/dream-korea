"use client";
// ТЗ 3-bosqich: yodlash mashqi — ekranda tasodifiy harf kartochkasi,
// bosilganda (sensor) yoki "Aylantirish" tugmasi (kompyuter) 180° aylanadi,
// orqasida o'qilishi ko'rinadi. "Talaffuzni eshitish" — audio (TTS).
import { useState } from "react";
import { Volume2, RotateCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speak } from "@/lib/tts";
import type { AlifboCard } from "@/lib/alifbo";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Flashcards({ cards, onDone }: { cards: AlifboCard[]; onDone: () => void }) {
  const [deck] = useState(() => shuffle(cards));
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const card = deck[i]!;

  function next() {
    setFlipped(false);
    if (i + 1 >= deck.length) setFinished(true);
    else setI(i + 1);
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-3xl">✓</span>
        <p className="font-semibold text-slate-800">Barcha {deck.length} ta kartochka ko&apos;rildi!</p>
        <Button onClick={onDone}>Yodladim — keyingi bosqich</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm font-medium text-slate-500">
        Kartochka <b className="text-slate-800">{i + 1}</b> / {deck.length} · bosqichma-bosqich random
      </p>
      {/* 3D aylanuvchi kartochka */}
      <div className="w-full max-w-xs [perspective:1200px]">
        <button
          type="button"
          aria-label={`Kartochkani aylantirish (${flipped ? "oldingi tomon" : "o'qilishi"})`}
          onClick={() => setFlipped((f) => !f)}
          className="relative block h-64 w-full cursor-pointer select-none [transform-style:preserve-3d] transition-transform duration-500"
          style={{ transform: flipped ? "rotateY(180deg)" : undefined }}
        >
          {/* old tomon — koreys harfi */}
          <span className="absolute inset-0 grid place-items-center rounded-3xl bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#7c3aed] text-white shadow-lg shadow-blue-500/25 [backface-visibility:hidden]">
            <span className="text-7xl font-bold drop-shadow">{card.ko}</span>
          </span>
          {/* orqa tomon — o'qilishi */}
          <span className="absolute inset-0 grid place-items-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="px-6 text-center">
              <span className="block text-3xl font-bold">{card.uz}</span>
              {card.note && <span className="mt-2 block text-sm text-emerald-50">{card.note}</span>}
              <span className="mt-3 block text-4xl opacity-80">{card.ko}</span>
            </span>
          </span>
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" onClick={() => speak(card.ko)}>
          <Volume2 className="mr-1.5 h-4 w-4" /> Talaffuzni eshitish
        </Button>
        <Button variant="outline" onClick={() => setFlipped((f) => !f)}>
          <RotateCw className="mr-1.5 h-4 w-4" /> Aylantirish
        </Button>
        <Button onClick={next}>
          Keyingisi <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-slate-400">Kartochkani bosing yoki «Aylantirish» — orqa tomonida javob ko&apos;rinadi</p>
    </div>
  );
}
