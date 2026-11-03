import { prisma } from "@/lib/db";
import { darsUser } from "@/lib/dars-auth";
import { z } from "zod";

const stage = z.enum(["video", "table", "cards", "match"]);

export async function GET(req: Request) {
  const user = await darsUser(req);
  if (!user) return Response.json({ error: "Auth kerak" }, { status: 401 });
  try {
    const progress = await prisma.alifboProgress.findMany({ where: { userId: user.id }, orderBy: { lessonNo: "asc" } });
    return Response.json({ progress });
  } catch { return Response.json({ error: "Alifbo progress yuklanmadi" }, { status: 503 }); }
}

export async function POST(req: Request) {
  const user = await darsUser(req);
  if (!user) return Response.json({ error: "Auth kerak" }, { status: 401 });
  const parsed = z.object({ lessonNo: z.number().int().min(1).max(4), stage }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "Progress formati noto‘g‘ri" }, { status: 400 });
  try {
    const { lessonNo, stage: name } = parsed.data;
    const row = await prisma.alifboProgress.upsert({
      where: { userId_lessonNo: { userId: user.id, lessonNo } },
      create: { userId: user.id, lessonNo, [name]: true },
      update: { [name]: true },
    });
    return Response.json({ progress: row });
  } catch { return Response.json({ error: "Progress saqlanmadi" }, { status: 503 }); }
}
