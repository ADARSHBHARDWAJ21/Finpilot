import test from "node:test";
import assert from "node:assert/strict";
import { computeDashboardOverview } from "../src/lib/dashboard/compute-overview.js";
import { currentMonthKey, resolveMonthKey, shiftMonth, timeGreeting, transactionMonthKey } from "../src/lib/dashboard/period.js";

const now = new Date("2026-10-04T17:30:00Z");
const tx = (date, type, amount, category = "Other") => ({ id: `${date}-${type}-${amount}`, transaction_date: date, type, amount, category, description: "Test record" });
const records = [tx("2026-08-31", "income", 1000), tx("2026-08-31", "expense", 200, "Food"), tx("2026-09-01", "income", 2000), tx("2026-09-30", "expense", 500, "Food"), tx("2026-10-01", "expense", 70), tx("2026-11-01", "income", 999999)];

test("India time drives greeting and month rollover independently of the server timezone", () => {
  assert.equal(currentMonthKey("2026-09-30T18:29:59Z"), "2026-09");
  assert.equal(currentMonthKey("2026-09-30T18:30:00Z"), "2026-10");
  assert.equal(timeGreeting("2026-10-04T06:29:59Z"), "Good morning");
  assert.equal(timeGreeting("2026-10-04T06:30:00Z"), "Good afternoon");
  assert.equal(timeGreeting("2026-10-04T11:30:00Z"), "Good evening");
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
});

test("invalid and future URL months fall back to current month", () => {
  for (const month of [undefined, ["2026-09"], "2026-13", "2026-00", "2026-9", "2027-01", "garbage"]) assert.equal(resolveMonthKey(month, now), "2026-10");
  assert.equal(resolveMonthKey("2025-12", now), "2025-12");
  assert.equal(transactionMonthKey("2026-09-30"), "2026-09");
  assert.equal(transactionMonthKey("2026-02-30"), null);
});

test("a past month excludes later transactions from totals, balances, charts and activity", () => {
  const overview = computeDashboardOverview(records, [], "2026-09", now);
  assert.equal(overview.monthLabel, "September 2026");
  assert.deepEqual(overview.summary.cards.map((card) => card.amount), ["₹2,000", "₹500", "₹1,500", "₹2,300", "2"]);
  assert.equal(overview.netWorth.chart.lineData.at(-1).value, 2300);
  assert.equal(overview.netWorth.chart.lineData.at(-1).monthKey, "2026-09");
  assert.ok(overview.netWorth.chart.lineData.every((row) => row.monthKey <= "2026-09"));
  assert.equal(overview.cashFlow.data.at(-1).expenses, 500);
  assert.equal(overview.expenses.totalFormatted, "₹500");
  assert.equal(overview.recentTransactions.length, 2);
  assert.equal(overview.recentTransactions[0].date, "30 Sept");
  assert.match(overview.summary.cards[0].change, /100.0% vs Aug 2026/);
});

test("months with no records show zero activity while retaining prior recorded balance", () => {
  const overview = computeDashboardOverview(records, [], "2026-07", now);
  assert.equal(overview.summary.transactionCount, 0);
  assert.equal(overview.expenses.hasData, false);
  assert.deepEqual(overview.expenses.data, []);
  assert.equal(overview.cashFlow.hasData, false);
  assert.equal(overview.netWorth.chart.hasData, false);
  assert.equal(overview.netWorth.recordedBalance, 0);
  assert.deepEqual(overview.budget.categories, []);
  const gap = computeDashboardOverview([tx("2025-12-31", "income", 1200)], [], "2026-02", now);
  assert.equal(gap.summary.transactionCount, 0);
  assert.equal(gap.netWorth.recordedBalance, 1200);
  assert.equal(gap.netWorth.chart.lineData.at(-1).value, 1200);
});

test("year boundaries, negative savings and refunds represented as income retain correct signs", () => {
  const overview = computeDashboardOverview([tx("2025-12-31", "expense", 100), tx("2026-01-01", "income", 40), tx("2026-01-31", "expense", -60), tx("2026-02-01", "income", 999)], [], "2026-01", now);
  assert.equal(overview.activity.savings, -20);
  assert.equal(overview.netWorth.recordedBalance, -120);
  assert.equal(overview.cashFlow.data.at(-1).savings, -20);
  assert.match(overview.summary.cards[1].change, /Dec 2025/);
});

test("budget limits come only from saved rows, including explicit zero limits", () => {
  const rows = [{ category: "Food", monthly_limit: 600 }, { category: "Housing", monthly_limit: 0 }];
  const overview = computeDashboardOverview([...records, tx("2026-09-10", "expense", 100, "Transport")], rows, "2026-09", now);
  assert.deepEqual(overview.budget.categories.find((category) => category.key === "Food"), { key: "Food", name: "Food & Dining", spent: 500, budget: 600, pct: 83 });
  assert.equal(overview.budget.categories.find((category) => category.key === "Housing").budget, 0);
  assert.equal(overview.budget.categories.find((category) => category.key === "Transport").budget, null);
  assert.deepEqual(rows, [{ category: "Food", monthly_limit: 600 }, { category: "Housing", monthly_limit: 0 }]);
});

test("large histories and malformed rows do not truncate or poison monthly totals", () => {
  const rows = Array.from({ length: 2501 }, (_, id) => ({ ...tx("2026-09-01", "income", 10), id: String(id) }));
  rows.push(tx("invalid", "income", 999999), tx("2026-09-02", "expense", "bad"));
  const overview = computeDashboardOverview(rows, [], "2026-09", now);
  assert.equal(overview.activity.income, 25010);
  assert.equal(overview.summary.transactionCount, 2501);
  assert.equal(overview.recentTransactions.length, 5);
});
