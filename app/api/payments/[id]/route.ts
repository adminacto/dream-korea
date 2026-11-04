import { getSession } from "@/lib/session";

// Financial history is never physically deleted. Administrators can void an
// operation, with a reason and balance validation, via the transactional ledger.
export async function DELETE(req: Request) {
  const auth = await getSession(req);
  if (!auth || auth.role !== "ADMIN") return Response.json({ error: "Faqat administrator" }, { status: 403 });
  return Response.json({ error: "Moliyaviy tarix o‘chirilmaydi. Paneldagi «Bekor qilish» amalidan foydalaning." }, { status: 409 });
}
