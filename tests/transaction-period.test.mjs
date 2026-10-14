import test from "node:test";
import assert from "node:assert/strict";
import { computeFinancialSummary, formatInr } from "../src/lib/dashboard/compute-summary.js";
import { computeDashboardOverview } from "../src/lib/dashboard/compute-overview.js";
import { transactionMonths, transactionsForMonth } from "../src/lib/transactions/period.js";

const now = new Date("2026-10-14T09:00:00Z");
const tx = (date, type, amount, created_at = "2026-10-14T09:00:00Z") => ({ transaction_date: date, type, amount, created_at });
const card = (summary, title) => summary.cards.find((item) => item.title === title);
const statement = [
  tx("2026-09-25", "expense", 15), tx("2026-09-26", "expense", 251),
  tx("2026-09-27", "expense", 15), tx("2026-09-28", "expense", 35),
  tx("2026-09-29", "expense", 30), tx("2026-09-30", "expense", 268),
  tx("2026-09-30", "expense", 30),
  tx("2026-10-01", "income", 5000), tx("2026-10-02", "income", 3000),
  tx("2026-10-03", "income", 2000), tx("2026-10-09", "income", 1299.21),
  tx("2026-10-01", "expense", 5000), tx("2026-10-09", "expense", 3115),
];

test("October transaction cards use the same monthly net as overview, excluding September spending", () => {
  const summary = computeFinancialSummary(statement, "2026-10", now);
  const overview = computeDashboardOverview(statement, [], "2026-10", now);
  assert.equal(summary.monthKey, "2026-10");
  assert.equal(summary.monthLabel, "October 2026");
  assert.equal(card(summary, "Total Income").amount, "₹11,299");
  assert.equal(card(summary, "Total Expenses").amount, "₹8,115");
  assert.equal(card(summary, "Monthly Balance").amount, "₹3,184");
  assert.equal(card(summary, "Monthly Balance").amount, card(overview.summary, "Total Savings").amount);
  assert.equal(card(summary, "Total Savings").amount, card(summary, "Monthly Balance").amount);
  assert.equal(card(summary, "Tax Liability (Est.)").change, "Not calculated yet");
  assert.equal(formatInr(3184.21), "₹3,184");
});

test("September records imported in October remain in September's totals", () => {
  const summary = computeFinancialSummary(statement, "2026-09", now);
  assert.equal(summary.monthLabel, "September 2026");
  assert.deepEqual(summary.cards.slice(0, 4).map((item) => item.amount), ["₹0", "₹644", "₹-644", "₹-644"]);
});

test("a mixed September and October import lists only the selected transaction month", () => {
  const records = [...statement, tx("invalid", "expense", 100)];
  const september = transactionsForMonth(records, "2026-09");
  const october = transactionsForMonth(records, "2026-10");
  assert.equal(september.length, 7);
  assert.equal(october.length, 6);
  assert.ok(september.every((item) => item.transaction_date.startsWith("2026-09") && item.created_at.startsWith("2026-10")));
  assert.equal(september.reduce((sum, item) => sum + item.amount, 0), 644);
  assert.equal(october.reduce((sum, item) => sum + (item.type === "income" ? item.amount : -item.amount), 0).toFixed(2), "3184.21");
  assert.deepEqual(transactionMonths(records), ["2026-09", "2026-10"]);
  assert.deepEqual(transactionsForMonth(records, "2026-08"), []);
  assert.equal(records.length, statement.length + 1);
});

test("default month follows India time across the year boundary and excludes future rows", () => {
  const rollover = new Date("2025-12-31T18:30:00Z");
  const records = [tx("2025-12-31", "expense", 1000), tx("2026-01-01", "income", 400), tx("2026-01-31", "expense", 600), tx("2026-02-01", "income", 999999)];
  const summary = computeFinancialSummary(records, undefined, rollover);
  assert.equal(summary.monthKey, "2026-01");
  assert.equal(summary.monthLabel, "January 2026");
  assert.deepEqual(summary.cards.slice(0, 4).map((item) => item.amount), ["₹400", "₹600", "₹-200", "₹-200"]);
  assert.match(card(summary, "Monthly Balance").text, /↑ 80\.0% vs Dec 2025/);
});

test("a future requested month falls back to the current month without including future income", () => {
  const records = [...statement, tx("2026-11-01", "income", 999999)];
  const summary = computeFinancialSummary(records, "2026-11", now);
  assert.equal(summary.monthKey, "2026-10");
  assert.equal(card(summary, "Monthly Balance").amount, "₹3,184");
  assert.deepEqual(summary.cards, computeFinancialSummary(records, undefined, now).cards);
});

test("improvement from a negative prior month's net is shown as an increase", () => {
  const summary = computeFinancialSummary(statement, "2026-10", now);
  const balance = card(summary, "Monthly Balance");
  assert.equal(balance.text, "↑ 594.4% vs Sept 2026");
  assert.equal(balance.positive, true);
});

test("a worsening negative monthly net is shown as a decrease", () => {
  const summary = computeFinancialSummary([tx("2026-09-30", "expense", 1000), tx("2026-10-01", "expense", 2000)], "2026-10", now);
  const balance = card(summary, "Monthly Balance");
  assert.equal(balance.text, "↓ 100.0% vs Sept 2026");
  assert.equal(balance.positive, false);
});

test("a new monthly net loss is marked negative when the prior month had no activity", () => {
  const records = [tx("2026-10-01", "income", 40), tx("2026-10-01", "expense", 100)];
  const summary = computeFinancialSummary(records, "2026-10", now);
  const overview = computeDashboardOverview(records, [], "2026-10", now);
  assert.equal(card(summary, "Monthly Balance").amount, "₹-60");
  assert.equal(card(summary, "Monthly Balance").positive, false);
  assert.equal(card(summary, "Total Savings").positive, card(overview.summary, "Total Savings").positive);
});

test("new expense activity is marked negative when the prior month had no spending", () => {
  const records = [tx("2026-10-01", "expense", 100)];
  const summary = computeFinancialSummary(records, "2026-10", now);
  const overview = computeDashboardOverview(records, [], "2026-10", now);
  assert.equal(card(summary, "Total Expenses").text, "New vs Sept 2026");
  assert.equal(card(summary, "Total Expenses").positive, false);
  assert.equal(card(summary, "Total Expenses").positive, card(overview.summary, "Total Expenses").positive);
});

test("a month without records has zero balance and ignores malformed transactions", () => {
  const records = [tx("2026-08-31", "income", 1200), tx("invalid", "income", 999999), tx("2026-09-30", "income", "bad"), tx("2026-09-30", "expense", Infinity)];
  const summary = computeFinancialSummary(records, "2026-09", now);
  assert.deepEqual(summary.cards.slice(0, 4).map((item) => item.amount), ["₹0", "₹0", "₹0", "₹0"]);
});
