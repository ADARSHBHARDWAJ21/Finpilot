import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCategoryName, getCategoryMeta } from "../src/lib/budget/category-meta.js";
import { BUDGET_PLAN_META_CATEGORY, normalizeCategoryBudgets, validateBudgetCategoryName } from "../src/lib/budget/category-plan.js";
import {
  categoryBudgetsForSave, computeSpentByCategoryForMonth, distributeTotalBudget,
  fetchBudgetPlanRows, rowsToBudgetPlan, saveBudgetPlanRows,
  seedBudgetPlansFromTransactions, syncSpentFromTransactions,
} from "../src/lib/budget/budget-plans-db.js";
import { buildReportCsv, computeBudgetDashboard } from "../src/lib/budget/compute-from-transactions.js";

const month = "2026-10";
const transaction = (category, amount, date = "2026-10-02", type = "expense") => ({ id: `${category}-${date}-${amount}`, category, amount, transaction_date: date, type });
const transactions = [transaction("Food", 300.15), transaction("Shopping", 500.25), transaction("Travel fund", 400.1), transaction("Other", 999, "2026-09-30"), transaction("Income", 2000, "2026-10-01", "income")];

function database(initial = [], failDelete = false) {
  const state = { rows: initial.map((row) => ({ ...row })), writes: [], nextId: 100 };
  return { state, from(table) {
    const filters = [];
    let operation = "read", values, monthFormats;
    const query = {
      select() { return query; },
      eq(key, value) { filters.push([key, value]); return query; },
      or(value) { monthFormats = value.split(",").map((part) => part.split(".").at(-1)); return query; },
      insert(value) { operation = "insert"; values = value; return query; },
      update(value) { operation = "update"; values = value; return query; },
      delete() { operation = "delete"; return query; },
      then(resolve, reject) {
        return Promise.resolve().then(() => {
          const matches = (row) => filters.every(([key, value]) => row[key] === value) && (!monthFormats || monthFormats.includes(row.month));
          if (operation === "read") return { data: state.rows.filter(matches).map((row) => ({ ...row })) };
          state.writes.push({ table, operation, filters, values });
          if (operation === "delete" && failDelete) return { error: { message: "Deletion failed" } };
          if (operation === "insert") for (const row of Array.isArray(values) ? values : [values]) state.rows.push({ ...row, id: `row-${state.nextId++}` });
          if (operation === "update") state.rows = state.rows.map((row) => matches(row) ? { ...row, ...values } : row);
          if (operation === "delete") state.rows = state.rows.filter((row) => !matches(row));
          return { data: [] };
        }).then(resolve, reject);
      },
    };
    return query;
  } };
}

const savedRow = (id, category, limit, extra = {}) => ({ id, user_id: "owner", year: 2026, month: "10", category, monthly_limit: limit, spent: 0, ...extra });

test("custom category labels survive normalization and known aliases share one key", () => {
  assert.equal(normalizeCategoryName("  Travel   fund  "), "Travel fund");
  assert.equal(getCategoryMeta("Travel fund").label, "Travel fund");
  assert.equal(validateBudgetCategoryName(" food & dining "), "Food");
  assert.equal(validateBudgetCategoryName("OTHERS"), "Other");
  assert.deepEqual(normalizeCategoryBudgets({ "Travel fund": "2500.55", Food: 0 }), { "Travel fund": 2500.55, Food: 0 });
  assert.throws(() => normalizeCategoryBudgets({ food: 100, "Food & Dining": 200 }), /more than once/);
  assert.throws(() => normalizeCategoryBudgets({ "Travel fund": 100, "TRAVEL FUND": 200 }), /more than once/);
});

test("budget validation rejects invalid amounts and reserved object or metadata keys", () => {
  for (const name of ["", "Income", "__proto__", "prototype", "constructor", BUDGET_PLAN_META_CATEGORY, "Bad\nname", "x".repeat(81)]) {
    assert.throws(() => validateBudgetCategoryName(name));
  }
  assert.throws(() => normalizeCategoryBudgets(JSON.parse('{"__proto__": 10}')));
  for (const amount of ["", "bad", -1, Infinity, 1_000_000_001]) assert.throws(() => normalizeCategoryBudgets({ Food: amount }));
  assert.equal(Object.prototype.polluted, undefined);
});

test("explicit category amounts are never rescaled to an older monthly total", () => {
  const old = { category_budgets: { Food: 10000 }, total_budget: 10000, categories_managed: true };
  assert.deepEqual(categoryBudgetsForSave({ categoryBudgets: { Food: 700, "Travel fund": 300 }, totalBudget: 10000 }, old), { Food: 700, "Travel fund": 300 });
  assert.deepEqual(categoryBudgetsForSave({ categoryBudgets: {}, totalBudget: 10000 }, old), {});
  assert.deepEqual(categoryBudgetsForSave({ categoryBudgets: { Food: 0 } }, old), { Food: 0 });
  assert.deepEqual(categoryBudgetsForSave({ totalBudget: 200 }, { category_budgets: { Food: 100, "Travel fund": 100 }, categories_managed: true }), { Food: 100, "Travel fund": 100 });
  assert.throws(() => categoryBudgetsForSave({ totalBudget: 100 }, { category_budgets: {}, categories_managed: true }), /Add a category/);
  assert.deepEqual(categoryBudgetsForSave({ totalBudget: 0 }, { category_budgets: {}, categories_managed: true }), {});
});

test("total-only redistribution retains zero categories and exactly allocates cents", () => {
  const split = distributeTotalBudget(0.01, { Food: 0, "Travel fund": 0, Other: 0 });
  assert.deepEqual(Object.keys(split), ["Food", "Travel fund", "Other"]);
  assert.equal(Object.values(split).reduce((sum, amount) => sum + amount, 0), 0.01);
  assert.ok(Object.values(split).every((amount) => amount >= 0));
});

test("saving custom and zero budgets persists exact amounts, managed keys and savings goal", async () => {
  const db = database([savedRow("foreign", "Shopping", 500, { user_id: "other" })]);
  const rows = await saveBudgetPlanRows(db, "owner", month, { Food: 0, "Travel fund": 2500.55 }, computeSpentByCategoryForMonth(transactions, month), { savingsGoal: 321.25 });
  const plan = rowsToBudgetPlan(rows);
  assert.deepEqual(plan.category_budgets, { Food: 0, "Travel fund": 2500.55 });
  assert.equal(plan.total_budget, 2500.55);
  assert.equal(plan.categories_managed, true);
  assert.equal(plan.savings_goal, 321.25);
  const dashboard = computeBudgetDashboard(transactions, plan, month);
  assert.deepEqual(dashboard.categories.map((row) => row.key).sort(), ["Food", "Travel fund"]);
  assert.equal(dashboard.categories.find((row) => row.key === "Food").budget, 0);
  assert.equal(dashboard.categories.find((row) => row.key === "Food").status, "Over Budget");
  assert.equal(dashboard.totalSpent, 1200.5);
  assert.equal(dashboard.unbudgetedSpent, 500.25);
  assert.equal(db.state.rows.find((row) => row.id === "foreign").monthly_limit, 500);
  assert.ok(db.state.writes.every((write) => write.table === "budget_plans"));
});

test("removed default and spending categories stay removed after reload without deleting expenses", async () => {
  const db = database([savedRow("food", "Food", 2000), savedRow("shopping", "Shopping", 500)]);
  await saveBudgetPlanRows(db, "owner", month, { "Travel fund": 800 }, computeSpentByCategoryForMonth(transactions, month));
  const refreshed = await fetchBudgetPlanRows(db, "owner", month);
  const dashboard = computeBudgetDashboard(transactions, rowsToBudgetPlan(refreshed), month);
  assert.deepEqual(dashboard.categories.map((row) => row.key), ["Travel fund"]);
  assert.equal(dashboard.totalBudget, 800);
  assert.equal(dashboard.totalSpent, 1200.5);
  assert.equal(dashboard.unbudgetedSpent, 800.4);
  assert.equal(dashboard.remaining, -400.5);
  assert.equal(transactions.length, 5);
  assert.ok(!refreshed.some((row) => ["Food", "Shopping"].includes(row.category)));
});

test("removing every category remains empty across reload, auto-seed and spending sync", async () => {
  const db = database();
  await saveBudgetPlanRows(db, "owner", month, { Food: 500 }, {}, { savingsGoal: 200 });
  await saveBudgetPlanRows(db, "owner", month, {});
  const beforeSeed = db.state.writes.length;
  const seeded = await seedBudgetPlansFromTransactions(db, "owner", month, transactions);
  assert.equal(db.state.writes.length, beforeSeed);
  const synced = await syncSpentFromTransactions(db, "owner", month, transactions);
  const plan = rowsToBudgetPlan(synced);
  assert.deepEqual(plan.category_budgets, {});
  assert.equal(plan.categories_managed, true);
  assert.equal(plan.savings_goal, 200);
  assert.equal(seeded.length, 1);
  const dashboard = computeBudgetDashboard(transactions, plan, month);
  assert.deepEqual(dashboard.categories, []);
  assert.equal(dashboard.totalBudget, 0);
  assert.equal(dashboard.totalSpent, 1200.5);
  assert.equal(dashboard.unbudgetedSpent, 1200.5);
  const restored = rowsToBudgetPlan(await saveBudgetPlanRows(db, "owner", month, { Food: 0 }));
  assert.deepEqual(restored.category_budgets, { Food: 0 });
});

test("removing a category deletes all duplicate month formats so old rows cannot resurrect it", async () => {
  const db = database([
    savedRow("older", "Food & Dining", 100, { month: "01", updated_at: "2026-01-01T00:00:00Z" }),
    savedRow("first", "Food", 200, { month: "1", updated_at: "2026-02-01T00:00:00Z" }),
    savedRow("second", "food", 300, { month: "01", updated_at: "2026-03-01T00:00:00Z" }),
  ]);
  await saveBudgetPlanRows(db, "owner", "2026-01", {});
  const refreshed = await fetchBudgetPlanRows(db, "owner", "2026-01");
  assert.deepEqual(rowsToBudgetPlan(refreshed).category_budgets, {});
  assert.ok(!refreshed.some((row) => normalizeCategoryName(row.category) === "Food"));
});

test("failed removals and invalid whole batches report errors instead of false success", async () => {
  const db = database([savedRow("old", "Food", 100)], true);
  await assert.rejects(saveBudgetPlanRows(db, "owner", month, {}), (error) => error.message === "Deletion failed");
  const invalid = database([savedRow("old", "Food", 100)]);
  await assert.rejects(saveBudgetPlanRows(invalid, "owner", month, { Food: 50, Shopping: -10 }));
  assert.equal(invalid.state.writes.length, 0);
  assert.equal(invalid.state.rows[0].monthly_limit, 100);
});

test("transaction spending keeps statement months, positive costs and selected-month trend", () => {
  const rows = [...transactions, transaction("Food", -10), transaction("Travel fund", Infinity), transaction("Other", 123, "2026-02-30")];
  const spending = computeSpentByCategoryForMonth(rows, month);
  assert.deepEqual(spending, { Food: 310.15, Shopping: 500.25, "Travel fund": 400.1 });
  const dashboard = computeBudgetDashboard(rows, { category_budgets: { Food: 500 }, total_budget: 500, categories_managed: true }, month);
  assert.equal(dashboard.totalSpent, 1210.5);
  assert.equal(dashboard.spendingTrend.at(-1).monthKey, month);
  assert.equal(dashboard.monthLabel, "October 2026");
  assert.ok(!dashboard.categories.some((row) => row.name === BUDGET_PLAN_META_CATEGORY));
});

test("custom category quotes stay valid in downloaded report CSV", () => {
  const dashboard = computeBudgetDashboard([], { category_budgets: { 'Family, "Travel"': 100 }, total_budget: 100, categories_managed: true }, month);
  assert.match(buildReportCsv(dashboard), /"Family, ""Travel""",100,0,100,0%,"On Track"/);
});
