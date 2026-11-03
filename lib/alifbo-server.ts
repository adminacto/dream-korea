import type { AlifboProgress, AlifboStage } from "@/lib/alifbo";

type ServerRow = { lessonNo: number; video: boolean; table: boolean; cards: boolean; match: boolean };

function token() {
  try { return sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; } catch { return ""; }
}

export function mergeServerAlifbo(local: AlifboProgress, rows: ServerRow[]): AlifboProgress {
  const next = { ...local };
  for (const row of rows) {
    next[String(row.lessonNo)] = {
      ...next[String(row.lessonNo)],
      video: !!row.video || !!next[String(row.lessonNo)]?.video,
      table: !!row.table || !!next[String(row.lessonNo)]?.table,
      cards: !!row.cards || !!next[String(row.lessonNo)]?.cards,
      match: !!row.match || !!next[String(row.lessonNo)]?.match,
    };
  }
  return next;
}

export async function fetchServerAlifbo(): Promise<AlifboProgress | null> {
  const tk = token();
  if (!tk) return null;
  try {
    const response = await fetch("/api/alifbo/progress", { headers: { Authorization: `Bearer ${tk}` } });
    if (!response.ok) return null;
    const data = await response.json() as { progress?: ServerRow[] };
    return mergeServerAlifbo({}, data.progress ?? []);
  } catch { return null; }
}

export async function syncAlifboStage(lessonNo: number, stage: AlifboStage) {
  const tk = token();
  if (!tk) return;
  try {
    await fetch("/api/alifbo/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
      body: JSON.stringify({ lessonNo, stage }),
    });
  } catch {}
}
