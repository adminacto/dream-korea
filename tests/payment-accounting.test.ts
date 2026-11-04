import assert from "node:assert/strict";
import { test } from "node:test";
import { accountTotals, dateSchema, monthlyTotals, paymentBillingMonth, type LedgerPayment } from "../lib/payment-accounting";

const payment = (amount: number, month = "2026-10", type = "PAYMENT"): LedgerPayment => ({ userId: "student", amount, status: "PAID", month, operationType: type });

test("partial payment, full payment, refund, overpayment", () => {
  const rows = [payment(200000)];
  assert.equal(accountTotals(450000, rows).debt, 250000);
  rows.push(payment(250000));
  assert.equal(accountTotals(450000, rows).debt, 0);
  rows.push(payment(150000, "2026-10", "REFUND"));
  assert.deepEqual(accountTotals(450000, rows), { tuition: 450000, received: 450000, refunded: 150000, net: 300000, debt: 150000, overpaid: 0 });
  rows.push(payment(200000));
  assert.equal(accountTotals(450000, rows).overpaid, 50000);
});

test("month isolation, legacy explicit months, unknown historical tariffs", () => {
  const rows = [payment(360000)];
  assert.equal(accountTotals(420000, rows.filter(p => paymentBillingMonth(p) === "2026-11")).received, 0);
  assert.equal(paymentBillingMonth({ month: "October" }), null);
  assert.equal(paymentBillingMonth({ month: "2026-10" }), "2026-10");
  assert.equal(paymentBillingMonth({ month: "2026-10", billingMonth: "2026-11" }), "2026-11");
  assert.equal(accountTotals(null, rows).debt, null);
});

test("voided and pending operations never affect income; aggregation is per account", () => {
  const rows = [payment(200000), { ...payment(100000), status: "PENDING" }, { ...payment(50000), voidedAt: new Date() }];
  const totals = monthlyTotals([accountTotals(450000, rows), accountTotals(360000, [payment(360000)]), accountTotals(null, [])]);
  assert.deepEqual(totals, { received: 560000, refunded: 0, net: 560000, debt: 250000, paidCount: 1, debtCount: 1, unknownCount: 1 });
});

test("invalid calendar dates are rejected", () => {
  assert.equal(dateSchema.safeParse("2026-02-30").success, false);
  assert.equal(dateSchema.safeParse("2026-11-04").success, true);
});
