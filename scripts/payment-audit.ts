import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { paymentBillingMonth } from "../lib/payment-accounting";

// Read-only by default. This is not a data backfill: legacy month/date/tariff
// values are deliberately never guessed or rewritten.
const db = new PrismaClient();
async function main() {
  const rows = await db.payment.findMany({ orderBy: { id: "asc" } });
  console.log(JSON.stringify({
    count: rows.length,
    fingerprint: createHash("sha256").update(JSON.stringify(rows)).digest("hex"),
    knownMonth: rows.filter(p => paymentBillingMonth(p) !== null).length,
    unknownMonth: rows.filter(p => paymentBillingMonth(p) === null).length,
    unknownActualDate: rows.filter(p => !p.operationDate && !p.paidAt).length,
    months: [...new Set(rows.map(paymentBillingMonth).filter(Boolean))].sort(),
  }, null, 2));
  if (process.argv.includes("--indexes")) {
    for (const [collection, indexes] of [
      ["Payment", [{ key: { userId: 1, billingMonth: 1 }, name: "Payment_userId_billingMonth_idx" }, { key: { billingMonth: 1, status: 1 }, name: "Payment_billingMonth_status_idx" }]],
      ["PaymentMonth", [{ key: { userId: 1, billingMonth: 1 }, name: "PaymentMonth_userId_billingMonth_idx" }, { key: { billingMonth: 1 }, name: "PaymentMonth_billingMonth_idx" }]],
    ] as const) {
      await db.$runCommandRaw({ createIndexes: collection, indexes: [...indexes] });
    }
    console.log("Payment indexes created; existing documents unchanged.");
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
