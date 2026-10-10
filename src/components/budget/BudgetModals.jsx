"use client";

import { useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import { DEFAULT_CATEGORY_KEYS } from "@/lib/budget/category-meta";

function ModalShell({ open, title, onClose, children }) {
  const returnFocusRef = useRef(null);
  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-[#152e26]/35 backdrop-blur-sm" />
      <Dialog.Content
        onOpenAutoFocus={() => { returnFocusRef.current = document.activeElement; }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
        }}
        className="fixed bottom-4 left-1/2 z-50 w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-border bg-white max-h-[90dvh] overflow-y-auto outline-none sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
          <Dialog.Close asChild>
          <button type="button" aria-label="Close dialog" className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
            <X size={18} />
          </button>
          </Dialog.Close>
        </div>
        <div className="p-5">{children}</div>
      </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function AddBudgetModal({ open, onClose, totalBudget, onSave, saving }) {
  return open ? (
    <AddBudgetForm key={totalBudget} onClose={onClose} totalBudget={totalBudget} onSave={onSave} saving={saving} />
  ) : null;
}

function AddBudgetForm({ onClose, totalBudget, onSave, saving }) {
  const [value, setValue] = useState(totalBudget);
  const budgetId = useId();

  return (
    <ModalShell open title="Add monthly budget" onClose={onClose}>
      <Dialog.Description className="text-sm text-muted-foreground mb-4">Set your total spending limit for this month.</Dialog.Description>
      <label htmlFor={budgetId} className="block text-xs font-medium text-[#647268] mb-1">Total monthly budget (₹)</label>
      <input
        id={budgetId}
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-border rounded-xl mb-4"
      />
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm bg-muted rounded-xl">
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave(Number(value))}
          className="flex-1 py-2.5 text-sm text-white bg-primary rounded-xl disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </ModalShell>
  );
}

export function ManageCategoriesModal({ open, onClose, categories, onSave, saving }) {
  return open ? (
    <ManageCategoriesForm
      key={JSON.stringify(categories.map(({ key, name, budget }) => [key, name, budget]))}
      onClose={onClose}
      categories={categories}
      onSave={onSave}
      saving={saving}
    />
  ) : null;
}

function ManageCategoriesForm({ onClose, categories, onSave, saving }) {
  const [rows, setRows] = useState(() =>
    categories.map(({ key, name, budget }) => ({ key, name, budget }))
  );

  function updateRow(index, budget) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, budget: Number(budget) } : r)));
  }

  return (
    <ModalShell open title="Manage categories" onClose={onClose}>
      <Dialog.Description className="text-sm text-muted-foreground mb-4">Set budget limits per category (from your real spending).</Dialog.Description>
      <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
        {rows.map((row, i) => (
          <div key={row.key} className="flex items-center gap-2">
            <span className="text-sm text-foreground flex-1 truncate">{row.name}</span>
            <input
              aria-label={`${row.name} budget (₹)`}
              type="number"
              min="0"
              value={row.budget}
              onChange={(e) => updateRow(i, e.target.value)}
              className="w-28 px-2 py-1.5 text-sm border border-border rounded-lg"
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
        className="w-full py-2.5 text-sm text-white bg-primary rounded-xl disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save category budgets"}
      </button>
    </ModalShell>
  );
}

export function BudgetPlannerModal({ open, onClose, totalBudget, spent, onSave, saving }) {
  return open ? (
    <BudgetPlannerForm
      key={JSON.stringify([totalBudget, spent])}
      onClose={onClose}
      totalBudget={totalBudget}
      spent={spent}
      onSave={onSave}
      saving={saving}
    />
  ) : null;
}

function BudgetPlannerForm({ onClose, totalBudget, spent, onSave, saving }) {
  const [total, setTotal] = useState(totalBudget);
  const [goal, setGoal] = useState(() => Math.max(0, totalBudget - spent));
  const totalId = useId();
  const goalId = useId();

  function autoSplit() {
    const per = Math.floor(Number(total) / DEFAULT_CATEGORY_KEYS.length / 500) * 500;
    const map = {};
    DEFAULT_CATEGORY_KEYS.forEach((k) => {
      map[k] = per;
    });
    onSave({ totalBudget: Number(total), categoryBudgets: map, savingsGoal: Number(goal) });
  }

  return (
    <ModalShell open title="Budget planner" onClose={onClose}>
      <Dialog.Description className="text-sm text-muted-foreground mb-4">
        Plan total budget and savings goal. Spent so far: ₹{spent.toLocaleString("en-IN")}.
      </Dialog.Description>
      <label htmlFor={totalId} className="block text-xs font-medium text-[#647268] mb-1">Total budget (₹)</label>
      <input
        id={totalId}
        type="number"
        value={total}
        onChange={(e) => setTotal(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-border rounded-xl mb-3"
      />
      <label htmlFor={goalId} className="block text-xs font-medium text-[#647268] mb-1">Savings goal (₹)</label>
      <input
        id={goalId}
        type="number"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-border rounded-xl mb-4"
      />
      <button
        type="button"
        disabled={saving}
        onClick={autoSplit}
        className="w-full py-2.5 text-sm text-white bg-primary rounded-xl disabled:opacity-60"
      >
        {saving ? "Saving…" : "Auto-split & save"}
      </button>
    </ModalShell>
  );
}
