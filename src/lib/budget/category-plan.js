import { normalizeCategoryName } from "./category-meta.js";

// The existing per-category table also stores this row so an intentionally
// empty category list remains saved without requiring a schema migration.
export const BUDGET_PLAN_META_CATEGORY = "__finpilot_budget_plan__";
export const MAX_BUDGET_CATEGORIES = 100;

export function validateBudgetCategoryName(value) {
  const raw = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!raw || raw.length > 80 || /[\u0000-\u001f\u007f]/.test(String(value ?? ""))) {
    throw new Error("Enter a category name from 1 to 80 characters.");
  }
  const key = normalizeCategoryName(raw);
  if (["income", "__proto__", "prototype", "constructor", BUDGET_PLAN_META_CATEGORY].includes(key.toLowerCase())) {
    throw new Error("Choose a different spending category name.");
  }
  return key;
}

export function validateBudgetAmount(value, label = "Budget") {
  if (!["number", "string"].includes(typeof value) || String(value).trim() === "") {
    throw new Error(`${label} must be an amount from ₹0 to ₹100 crore.`);
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000) {
    throw new Error(`${label} must be an amount from ₹0 to ₹100 crore.`);
  }
  return Math.round(amount * 100) / 100;
}

export function normalizeCategoryBudgets(categoryBudgets) {
  if (!categoryBudgets || typeof categoryBudgets !== "object" || Array.isArray(categoryBudgets)) {
    throw new Error("Choose the categories and amounts to save.");
  }
  const entries = Object.entries(categoryBudgets);
  if (entries.length > MAX_BUDGET_CATEGORIES) throw new Error(`Choose up to ${MAX_BUDGET_CATEGORIES} categories.`);
  const seen = new Set();
  return Object.fromEntries(entries.map(([category, amount]) => {
    const key = validateBudgetCategoryName(category);
    const comparison = key.toLowerCase();
    if (seen.has(comparison)) throw new Error(`The category ${key} appears more than once.`);
    seen.add(comparison);
    return [key, validateBudgetAmount(amount, `${key} budget`)];
  }));
}
