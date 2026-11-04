import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// Compatibility reader for the existing student/teacher screens. Financial
// mutations all pass through /ledger; refunds must not look like receipts here.
export async function GET(req: Request) {
  const auth = await getSession(req);
  if (!auth) return Response.json({ error: "Auth kerak" }, { status: 401 });
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") || "";
  const groupId = url.searchParams.get("groupId") || "";
  if ([userId, groupId].some(id => id && !/^[a-f\d]{24}$/i.test(id))) return Response.json({ error: "ID noto‘g‘ri" }, { status: 400 });
  try {
    const where: Prisma.PaymentWhereInput = { AND: [
      { OR: [{ operationType: { isSet: false } }, { operationType: null }, { operationType: "PAYMENT" }] },
      { OR: [{ voidedAt: { isSet: false } }, { voidedAt: null }] },
    ] };
    if (auth.role === "TEACHER") {
      const groups = await prisma.group.findMany({ where: { teacherId: auth.id, ...(groupId ? { id: groupId } : {}) }, select: { id: true } });
      const members = await prisma.groupMember.findMany({ where: { groupId: { in: groups.map(g => g.id) } }, select: { userId: true } });
      where.userId = { in: members.map(m => m.userId).filter(id => !userId || id === userId) };
    } else if (auth.role === "ADMIN") {
      if (userId) where.userId = userId;
      else if (groupId) {
        const members = await prisma.groupMember.findMany({ where: { groupId }, select: { userId: true } });
        where.userId = { in: members.map(m => m.userId) };
      }
    } else {
      if (!auth.id) return Response.json({ error: "Auth kerak" }, { status: 401 });
      where.userId = auth.id;
    }
    const payments = await prisma.payment.findMany({ where, orderBy: { createdAt: "desc" }, include: {
      user: { select: { id: true, name: true, email: true, groupMembers: { select: { group: { select: { name: true } } } } } },
    } });
    return Response.json({ payments: payments.map(p => ({ ...p, user: { id: p.user.id, name: p.user.name, email: p.user.email, groupNames: p.user.groupMembers.map(m => m.group.name) } })) });
  } catch (error) {
    console.error("GET payments", error);
    return Response.json({ error: "To‘lovlar yuklanmadi" }, { status: 503 });
  }
}

async function legacyWrite(req: Request) {
  const auth = await getSession(req);
  if (!auth || auth.role !== "ADMIN") return Response.json({ error: "Faqat administrator" }, { status: 403 });
  return Response.json({ error: "Operatsiya uchun yangi to‘lov panelidan foydalaning" }, { status: 409 });
}
export const POST = legacyWrite;
export const PATCH = legacyWrite;
