import test from "node:test";
import assert from "node:assert/strict";
import { syncOnboardingBudgetDefaults, syncOnboardingToModules } from "../src/lib/onboarding/sync-to-modules.js";
import { BUDGET_PLAN_META_CATEGORY } from "../src/lib/budget/category-plan.js";
import { fetchBudgetPlanRows, rowsToBudgetPlan, saveBudgetPlanRows } from "../src/lib/budget/budget-plans-db.js";
import { computeBudgetDashboard } from "../src/lib/budget/compute-from-transactions.js";

const now = new Date("2026-01-14T09:00:00Z");
const profile = { financial_year: "2026-27", annual_ctc: 960000, basic_salary: 30000, hra: 15000, age: 30, tax_regime: "new", monthly_inhand_salary: 60000, monthly_food_spend: 9000, monthly_transport_spend: 4000, monthly_shopping_spend: 3000 };
const row = (id, category, limit = 0, extra = {}) => ({ id, user_id: "owner", category, monthly_limit: limit, month: "01", year: 2026, spent: 0, ...extra });

function database(initial = [], { failRead = false, failWrite = false } = {}) {
  const state = { rows: initial.map((value) => ({ ...value })), reads: [], writes: [], nextId: 100 };
  return { state, from(table) {
    let operation = "read", values, monthFormats;
    const filters = [];
    const query = {
      select() { return query; },
      eq(key, value) { filters.push([key, value]); return query; },
      or(value) { monthFormats = value.split(",").map((part) => part.split(".").at(-1)); return query; },
      insert(value) { operation = "insert"; values = value; return query; },
      update(value) { operation = "update"; values = value; return query; },
      upsert(value) { operation = "upsert"; values = value; return query; },
      delete() { operation = "delete"; return query; },
      then(resolve, reject) {
        return Promise.resolve().then(() => {
          const matches = (value) => filters.every(([key, expected]) => value[key] === expected) && (!monthFormats || monthFormats.includes(value.month));
          if (operation === "read") {
            state.reads.push({ table, filters, monthFormats });
            if (table === "budget_plans" && failRead) return { error: { message: "Read failed" } };
            return { data: state.rows.filter(matches).map((value) => ({ ...value })) };
          }
          state.writes.push({ table, operation, filters, values });
          if (table !== "budget_plans") return { data: [] };
          if (failWrite) return { error: { message: "Write failed" } };
          if (operation === "insert") for (const value of Array.isArray(values) ? values : [values]) state.rows.push({ ...value, id: `row-${state.nextId++}` });
          if (operation === "update") state.rows = state.rows.map((value) => matches(value) ? { ...value, ...values } : value);
          if (operation === "delete") state.rows = state.rows.filter((value) => !matches(value));
          return { data: [] };
        }).then(resolve, reject);
      },
    };
    return query;
  } };
}

test("settings sync leaves managed custom, deleted and zero budget choices unchanged", async () => {
  const db = database([row("legacy-food", "Food", 2000)]);
  await saveBudgetPlanRows(db, "owner", "2026-01", { Food: 0, "Travel fund": 1234.56 }, {}, { savingsGoal: 1000 });
  const saved = db.state.rows.map((value) => ({ ...value }));
  db.state.writes = [];
  const summary = await syncOnboardingToModules(db, "owner", profile, now);
  assert.equal(summary.chosenRegime, "new");
  assert.deepEqual(db.state.rows, saved);
  assert.ok(!db.state.writes.some((write) => write.table === "budget_plans"));
  assert.ok(db.state.writes.some((write) => write.table === "salary_profiles"));
  assert.ok(db.state.writes.some((write) => write.table === "tax_calculations"));
  assert.ok(db.state.writes.some((write) => write.table === "ai_insights"));
  const plan = rowsToBudgetPlan(await fetchBudgetPlanRows(db, "owner", "2026-01"));
  assert.deepEqual(plan.category_budgets, { Food: 0, "Travel fund": 1234.56 });
  assert.equal(plan.savings_goal, 1000);
  const dashboard = computeBudgetDashboard([{ transaction_date: "2026-01-02", type: "expense", category: "Shopping", amount: 500 }], plan, "2026-01");
  assert.deepEqual(dashboard.categories.map((category) => category.key).sort(), ["Food", "Travel fund"]);
  assert.equal(dashboard.totalSpent, 500);
  assert.equal(dashboard.unbudgetedSpent, 500);
});

test("a managed empty plan stays empty after a settings save", async () => {
  const db = database();
  await saveBudgetPlanRows(db, "owner", "2026-01", {});
  db.state.writes = [];
  await syncOnboardingBudgetDefaults(db, "owner", profile, now);
  assert.equal(db.state.writes.length, 0);
  assert.equal(db.state.rows.length, 1);
  assert.equal(db.state.rows[0].category, BUDGET_PLAN_META_CATEGORY);
  assert.deepEqual(rowsToBudgetPlan(await fetchBudgetPlanRows(db, "owner", "2026-01")).category_budgets, {});
});

test("managed markers in either padded or legacy unpadded month block profile budget writes", async () => {
  for (const month of ["01", "1"]) {
    const db = database([row("marker", BUDGET_PLAN_META_CATEGORY, 0, { month })]);
    await syncOnboardingBudgetDefaults(db, "owner", profile, now);
    assert.equal(db.state.writes.length, 0, month);
    assert.deepEqual(db.state.reads[0].monthFormats, ["01", "1"]);
  }
});

test("another account, year or month's marker cannot block this account's current defaults", async () => {
  const db = database([
    row("other-account", BUDGET_PLAN_META_CATEGORY, 0, { user_id: "other" }),
    row("other-year", BUDGET_PLAN_META_CATEGORY, 0, { year: 2025 }),
    row("other-month", BUDGET_PLAN_META_CATEGORY, 0, { month: "02" }),
  ]);
  const original = db.state.rows.map((value) => ({ ...value }));
  await syncOnboardingBudgetDefaults(db, "owner", profile, now);
  assert.deepEqual(db.state.rows.slice(0, 3), original);
  const current = db.state.rows.filter((value) => value.user_id === "owner" && value.year === 2026 && value.month === "01");
  assert.deepEqual(current.map(({ category, monthly_limit }) => [category, monthly_limit]), [["Food", 9000], ["Transport", 4000], ["Shopping", 3000]]);
});

test("legacy budget defaults still update existing rows and keep account scope", async () => {
  const db = database([row("food", "Food & Dining", 100, { month: "1" }), row("foreign-food", "Food", 500, { user_id: "other" })]);
  await syncOnboardingBudgetDefaults(db, "owner", profile, now);
  const food = db.state.rows.filter((value) => value.user_id === "owner" && value.category === "Food");
  assert.equal(food.length, 1);
  assert.equal(food[0].id, "food");
  assert.equal(food[0].monthly_limit, 9000);
  assert.equal(food[0].month, "01");
  assert.equal(db.state.rows.find((value) => value.id === "foreign-food").monthly_limit, 500);
  assert.ok(db.state.writes.filter((write) => write.operation === "update").every((write) => write.filters.some(([key, value]) => key === "user_id" && value === "owner")));
});

test("India midnight chooses the new month independently of the server date", async () => {
  const before = database([row("january", BUDGET_PLAN_META_CATEGORY)]);
  await syncOnboardingBudgetDefaults(before, "owner", profile, new Date("2026-01-31T18:29:59Z"));
  assert.equal(before.state.writes.length, 0);
  const after = database([row("january", BUDGET_PLAN_META_CATEGORY)]);
  await syncOnboardingBudgetDefaults(after, "owner", profile, new Date("2026-01-31T18:30:00Z"));
  assert.equal(after.state.writes.length, 3);
  assert.ok(after.state.writes.every((write) => write.values.month === "02" && write.values.year === 2026));
  assert.deepEqual(after.state.reads[0].monthFormats, ["02", "2"]);
});

test("a failed saved-budget read aborts before any budget writes", async () => {
  const db = database([row("food", "Food", 123)], { failRead: true });
  await assert.rejects(syncOnboardingBudgetDefaults(db, "owner", profile, now), /budget records could not be checked/);
  assert.equal(db.state.writes.length, 0);
  assert.equal(db.state.rows[0].monthly_limit, 123);
});

test("budget write failures are reported instead of claiming completed profile sync", async () => {
  const db = database([], { failWrite: true });
  await assert.rejects(syncOnboardingBudgetDefaults(db, "owner", profile, now), /budget records could not be updated/);
  assert.equal(db.state.rows.length, 0);
});
