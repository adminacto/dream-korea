/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

async function main() {
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `/dreamkorea_payment_test_${Date.now()}`;
  const secret = crypto.randomBytes(48).toString('hex');
  const adminEmail = 'panel-admin@example.test';
  const db = new PrismaClient({ datasourceUrl: url.toString() });
  let server, browser;
  try {
    const teacher = await db.user.create({ data: { name: 'Teacher Browser', email: 'teacher@example.test', role: 'TEACHER', password: 'test' } });
    const student = await db.user.create({ data: { name: 'Browser Student', email: 'student@example.test', role: 'STUDENT', password: 'test', monthlyFee: 450000, lessonHours: 12 } });
    await db.user.create({ data: { name: 'Other Student', email: 'other@example.test', role: 'STUDENT', password: 'test', monthlyFee: 360000, lessonHours: 24 } });
    const group = await db.group.create({ data: { name: 'Browser Group', teacherId: teacher.id } });
    await db.groupMember.create({ data: { groupId: group.id, userId: student.id } });
    server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3197'], { env: { ...process.env, DATABASE_URL: url.toString(), AUTH_SECRET: secret, ADMIN_EMAIL: adminEmail }, stdio: ['ignore', 'pipe', 'pipe'] });
    let logs = '';
    server.stdout.on('data', b => { logs += b; });
    server.stderr.on('data', b => { logs += b; });
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch('http://localhost:3197/api/payments/ledger')).status === 401) break; } catch {}
      if (i === 99) throw new Error(`Server failed: ${logs}`);
      await new Promise(r => setTimeout(r, 200));
    }
    const body = Buffer.from(JSON.stringify({ email: adminEmail, name: 'Browser Admin', role: 'ADMIN', tv: 0, exp: Date.now() + 3600000 })).toString('base64url');
    const token = `${body}.${crypto.createHmac('sha256', secret).update(body).digest('base64url')}`;
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    await context.addCookies([{ name: 'dk_admin', value: token, url: 'http://localhost:3197' }]);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://localhost:3197/adminstrationpanelofdreamkorea/payments');
    await page.getByRole('button', { name: 'To‘lov qo‘shish', exact: true }).waitFor();
    await page.getByRole('button', { name: 'To‘lov qo‘shish', exact: true }).isEnabled().then(async enabled => { if (!enabled) await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.includes('To‘lov qo‘shish') && !b.disabled)); });
    await page.getByLabel('Ism va familiya bo‘yicha qidirish').fill('Browser');
    await page.getByLabel('Ustoz bo‘yicha filtr').selectOption(teacher.id);
    await page.getByLabel('Soatlar bo‘yicha filtr').selectOption('12');
    assert.equal(await page.locator('table').first().locator('tbody tr').count(), 1);
    await page.getByRole('button', { name: 'Browser Student', exact: true }).click();
    await page.getByRole('button', { name: 'To‘lov qo‘shish', exact: true }).click();
    let dialog = page.getByRole('dialog');
    await dialog.getByLabel('Qabul qilinadigan summa · UZS').fill('200000');
    await dialog.getByRole('button', { name: 'Saqlash', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.body.textContent.replace(/\D/g, '').includes('250000'));
    assert.equal(await db.payment.count({ where: { userId: student.id, amount: 200000 } }), 1);
    await page.getByRole('button', { name: 'Refund', exact: true }).first().click();
    dialog = page.getByRole('dialog');
    await dialog.getByLabel('Qaytariladigan summa · UZS').fill('50000');
    await dialog.getByRole('button', { name: 'Saqlash', exact: true }).click();
    try { await dialog.waitFor({ state: 'hidden', timeout: 10000 }); }
    catch { console.log('REFUND DIALOG:', await dialog.innerText()); console.log('REFUNDS IN DB:', await db.payment.findMany({ where: { userId: student.id }, select: { amount: true, operationType: true, billingMonth: true, status: true } })); throw new Error('Refund dialog did not close'); }
    assert.equal(await db.payment.count({ where: { userId: student.id, operationType: 'REFUND', amount: 50000 } }), 1);
    await page.getByRole('button', { name: 'To‘lov qo‘shish', exact: true }).click();
    dialog = page.getByRole('dialog');
    await dialog.getByLabel('Hisob oyi', { exact: true }).fill('2026-10');
    await page.waitForResponse(r => r.url().includes('billingMonth=2026-10&userId=') && r.request().method() === 'GET');
    await dialog.getByLabel('Narx · UZS', { exact: true }).fill('420000');
    await dialog.getByLabel('Qabul qilinadigan summa · UZS').fill('100000');
    await dialog.getByRole('button', { name: 'Saqlash', exact: true }).click();
    try { await dialog.waitFor({ state: 'hidden', timeout: 10000 }); }
    catch { console.log('OLD MONTH DIALOG:', await dialog.innerText()); console.log('MESSAGES:', await page.locator('[data-sonner-toast]').allTextContents()); throw new Error('Old month dialog did not close'); }
    const old = await db.payment.findFirstOrThrow({ where: { userId: student.id, billingMonth: '2026-10' } });
    assert.equal(old.amount, 100000);
    assert.ok(old.operationDate);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: '/tmp/opencode/payment-panel-mobile.png', fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Page must not overflow horizontally');
    assert.deepEqual(errors, []);
    console.log('PASS: browser search + teacher + hours, payment/refund persisted, old month payment, mobile layout, no runtime errors');
  } finally {
    if (browser) await browser.close();
    if (server) server.kill();
    await db.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
