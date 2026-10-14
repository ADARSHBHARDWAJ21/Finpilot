import test from "node:test";
import assert from "node:assert/strict";
import {
  addCategoryBudgetDraft,
  budgetAmountDraft,
  buildBudgetPlannerSave,
  categoryBudgetDrafts,
  categoryBudgetsFromDrafts,
  readBudgetAmount,
} from "../src/lib/budget/budget-form-drafts.js";

test("budget drafts preserve a cleared field and decimal text until a valid save", () => {
  const initial = categoryBudgetDrafts([{ key: "Food", name: "Food & Dining", budget: 0 }]);
  const cleared = initial.map((row) => ({ ...row, budget: "" }));
  assert.equal(cleared[0].budget, "");
  assert.throws(() => categoryBudgetsFromDrafts(cleared), /Enter food & dining budget/i);
  const entered = cleared.map((row) => ({ ...row, budget: "123.45" }));
  assert.deepEqual(categoryBudgetsFromDrafts(entered), { Food: 123.45 });
  assert.equal(budgetAmountDraft(undefined), "");
  assert.equal(budgetAmountDraft(0), "0");
});

test("explicit zero budgets are valid while negative, blank and nonfinite inputs are rejected", () => {
  assert.equal(readBudgetAmount("0"), 0);
  assert.equal(readBudgetAmount(".50"), 0.5);
  for (const value of ["", " ", "-1", "Infinity", "NaN", "1e3", "0x10", "100abc", "9".repeat(400)]) {
    assert.throws(() => readBudgetAmount(value), Error);
  }
});

test("adding a custom named category preserves its label and permits an explicit zero allocation", () => {
  const existing = categoryBudgetDrafts([{ key: "Food", name: "Food & Dining", budget: 1500 }]);
  const updated = addCategoryBudgetDraft(existing, "  Family   Travel  ");
  assert.deepEqual(updated[1], { key: "Family Travel", name: "Family Travel", budget: "0" });
  assert.deepEqual(categoryBudgetsFromDrafts(updated), { Food: 1500, "Family Travel": 0 });
  assert.equal(existing.length, 1);
});

test("category additions reject existing labels and aliases regardless of case", () => {
  const existing = categoryBudgetDrafts([{ key: "Food", name: "Food & Dining", budget: 100 }, { key: "Travel", name: "Travel", budget: 0 }]);
  for (const name of ["Food", " food & dining ", "TRAVEL"]) {
    assert.throws(() => addCategoryBudgetDraft(existing, name), /already in your plan/);
  }
});

test("category additions reject reserved or invalid names before saving", () => {
  for (const name of ["", "Income", "__proto__", "constructor", "__finpilot_budget_plan__", "A\nB", "A".repeat(81)]) {
    assert.throws(() => addCategoryBudgetDraft([], name), Error);
  }
});

test("removing categories omits their budgets and removing all produces an explicit empty plan", () => {
  const rows = categoryBudgetDrafts([{ key: "Food", name: "Food & Dining", budget: 100 }, { key: "Travel", name: "Travel", budget: 0 }]);
  assert.deepEqual(categoryBudgetsFromDrafts(rows.filter((row) => row.key !== "Food")), { Travel: 0 });
  assert.deepEqual(categoryBudgetsFromDrafts([]), {});
});

test("planner splits only currently configured categories and preserves the requested total and savings goal", () => {
  const plan = buildBudgetPlannerSave("1000.10", "75.25", [{ key: "Travel" }, { key: "Childcare" }, { key: "Healthcare" }]);
  assert.deepEqual(plan, { totalBudget: 1000.1, savingsGoal: 75.25, categoryBudgets: { Travel: 333.36, Childcare: 333.36, Healthcare: 333.38 } });
  assert.equal(Math.round(Object.values(plan.categoryBudgets).reduce((sum, amount) => sum + amount, 0) * 100), 100010);
  assert.equal(Object.hasOwn(plan.categoryBudgets, "Food"), false);
});

test("planner accepts zero and requires an active category before allocation", () => {
  assert.deepEqual(buildBudgetPlannerSave("0", "0", [{ key: "Travel" }]), { totalBudget: 0, savingsGoal: 0, categoryBudgets: { Travel: 0 } });
  assert.throws(() => buildBudgetPlannerSave("1000", "0", []), /Add a category/);
  assert.throws(() => buildBudgetPlannerSave("", "0", [{ key: "Travel" }]), /Enter total budget/);
  assert.throws(() => buildBudgetPlannerSave("1000", "-1", [{ key: "Travel" }]), /Savings goal/);
});
