"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { DEFAULT_CATEGORY_KEYS } from "@/lib/budget/category-meta";

function ModalShell({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function AddBudgetModal({ open, onClose, totalBudget, onSave, saving }) {
  const [value, setValue] = useState(totalBudget);

  useEffect(() => {
    if (open) setValue(totalBudget);
  }, [open, totalBudget]);

  return (
    <ModalShell open={open} title="Add monthly budget" onClose={onClose}>
      <p className="text-sm text-gray-500 mb-4">Set your total spending limit for this month.</p>
      <label className="block text-xs font-medium text-gray-600 mb-1">Total monthly budget (₹)</label>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl mb-4"
      />
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm bg-gray-100 rounded-xl">
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave(Number(value))}
          className="flex-1 py-2.5 text-sm text-white bg-indigo-600 rounded-xl disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </ModalShell>
  );
}

export function ManageCategoriesModal({ open, onClose, categories, onSave, saving }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (open) {
      setRows(
        categories.map((c) => ({
          key: c.key,
          name: c.name,
          budget: c.budget,
        }))
      );
    }
  }, [open, categories]);

  function updateRow(index, budget) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, budget: Number(budget) } : r)));
  }

  return (
    <ModalShell open={open} title="Manage categories" onClose={onClose}>
      <p className="text-sm text-gray-500 mb-4">Set budget limits per category (from your real spending).</p>
      <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
        {rows.map((row, i) => (
          <div key={row.key} className="flex items-center gap-2">
            <span className="text-sm text-gray-700 flex-1 truncate">{row.name}</span>
            <input
              type="number"
              min="0"
              value={row.budget}
              onChange={(e) => updateRow(i, e.target.value)}
              className="w-28 px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={() => {
          const map = {};
          rows.forEach((r) => {
            map[r.key] = r.budget;
          });
          onSave(map);
        }}
        className="w-full py-2.5 text-sm text-white bg-indigo-600 rounded-xl disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save category budgets"}
      </button>
    </ModalShell>
  );
}

export function BudgetPlannerModal({ open, onClose, totalBudget, spent, onSave, saving }) {
  const [total, setTotal] = useState(totalBudget);
  const [goal, setGoal] = useState(0);

  useEffect(() => {
    if (open) {
      setTotal(totalBudget);
      setGoal(Math.max(0, totalBudget - spent));
    }
  }, [open, totalBudget, spent]);

  function autoSplit() {
    const per = Math.floor(Number(total) / DEFAULT_CATEGORY_KEYS.length / 500) * 500;
    const map = {};
    DEFAULT_CATEGORY_KEYS.forEach((k) => {
      map[k] = per;
    });
    onSave({ totalBudget: Number(total), categoryBudgets: map, savingsGoal: Number(goal) });
  }

  return (
    <ModalShell open={open} title="Budget planner" onClose={onClose}>
      <p className="text-sm text-gray-500 mb-4">
        Plan total budget and savings goal. Spent so far: ₹{spent.toLocaleString("en-IN")}.
      </p>
      <label className="block text-xs font-medium text-gray-600 mb-1">Total budget (₹)</label>
      <input
        type="number"
        value={total}
        onChange={(e) => setTotal(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl mb-3"
      />
      <label className="block text-xs font-medium text-gray-600 mb-1">Savings goal (₹)</label>
      <input
        type="number"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl mb-4"
      />
      <button
        type="button"
        disabled={saving}
        onClick={autoSplit}
        className="w-full py-2.5 text-sm text-white bg-indigo-600 rounded-xl disabled:opacity-60"
      >
        {saving ? "Saving…" : "Auto-split & save"}
      </button>
    </ModalShell>
  );
}
