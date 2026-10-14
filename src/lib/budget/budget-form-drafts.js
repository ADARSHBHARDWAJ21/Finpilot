import { getCategoryMeta } from "./category-meta.js";
import { MAX_BUDGET_CATEGORIES, normalizeCategoryBudgets, validateBudgetAmount, validateBudgetCategoryName } from "./category-plan.js";

export function budgetAmountDraft(value) {
  return value == null ? "" : String(value);
}

export function readBudgetAmount(draft, label = "Budget") {
  const text = String(draft ?? "").trim();
  if (!text) throw new Error(`Enter ${label.toLowerCase()}. Enter 0 for no budget.`);
  const value = Number(text);
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a valid amount of 0 or more.`);
  }
  return validateBudgetAmount(value, label);
}

export function categoryBudgetDrafts(categories = []) {
  return categories.map(({ key, name, budget }) => ({ key, name, budget: budgetAmountDraft(budget) }));
}

export function addCategoryBudgetDraft(rows, rawName) {
  const key = validateBudgetCategoryName(rawName);
  const displayName = getCategoryMeta(key).label;
  const identifiers = [key, displayName].map((value) => value.toLocaleLowerCase("en-IN"));
  if (rows.some((row) => [row.key, row.name].some((value) => identifiers.includes(String(value).toLocaleLowerCase("en-IN"))))) {
    throw new Error("That category is already in your plan.");
  }
  if (rows.length >= MAX_BUDGET_CATEGORIES) throw new Error(`Choose up to ${MAX_BUDGET_CATEGORIES} categories.`);
  return [...rows, { key, name: displayName, budget: "0" }];
}

export function categoryBudgetsFromDrafts(rows) {
  return normalizeCategoryBudgets(Object.fromEntries(rows.map((row) => [row.key, readBudgetAmount(row.budget, `${row.name} budget`)])));
}

export function buildBudgetPlannerSave(totalDraft, goalDraft, categories = []) {
  const totalBudget = readBudgetAmount(totalDraft, "Total budget");
  const savingsGoal = readBudgetAmount(goalDraft, "Savings goal");
  const keys = [...new Set(categories.map((category) => category.key))];
  if (!keys.length) throw new Error("Add a category in Manage Categories before splitting your budget.");
  const totalCents = Math.round(totalBudget * 100);
  const perCategory = Math.floor(totalCents / keys.length);
  const categoryBudgets = normalizeCategoryBudgets(Object.fromEntries(keys.map((key, index) => [
    key,
    (index === keys.length - 1 ? totalCents - perCategory * (keys.length - 1) : perCategory) / 100,
  ])));
  return { totalBudget, categoryBudgets, savingsGoal };
}
