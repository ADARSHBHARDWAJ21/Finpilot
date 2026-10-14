"use client";

import { useId, useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Dialog } from "radix-ui";
import {
  addCategoryBudgetDraft,
  budgetAmountDraft,
  buildBudgetPlannerSave,
  categoryBudgetDrafts,
  categoryBudgetsFromDrafts,
  readBudgetAmount,
} from "@/lib/budget/budget-form-drafts";

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

export function AddBudgetModal({ open, onClose, totalBudget, onSave, saving, error = "" }) {
  return open ? (
    <AddBudgetForm key={totalBudget} onClose={onClose} totalBudget={totalBudget} onSave={onSave} saving={saving} error={error} />
  ) : null;
}

function AddBudgetForm({ onClose, totalBudget, onSave, saving, error: serverError }) {
  const [value, setValue] = useState(() => budgetAmountDraft(totalBudget));
  const [error, setError] = useState("");
  const budgetId = useId();

  function save(event) {
    event.preventDefault();
    if (saving) return;
    try {
      const total = readBudgetAmount(value, "Total monthly budget");
      setError("");
      onSave(total);
    } catch (issue) {
      setError(issue.message);
    }
  }

  return (
    <ModalShell open title="Add monthly budget" onClose={onClose}>
      <Dialog.Description className="text-sm text-muted-foreground mb-4">Set your total spending limit for this month.</Dialog.Description>
      <form onSubmit={save}>
      <label htmlFor={budgetId} className="block text-xs font-medium text-[#647268] mb-1">Total monthly budget (₹)</label>
      <input
        id={budgetId}
        type="text"
        inputMode="decimal"
        placeholder="Amount"
        disabled={saving}
        value={value}
        onFocus={(event) => event.target.select()}
        onChange={(e) => { setValue(e.target.value); setError(""); }}
        className="w-full px-3 py-2 text-sm border border-border rounded-xl mb-4"
      />
      {(error || serverError) && <p role="alert" className="mb-3 text-sm text-red-600">{error || serverError}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm bg-muted rounded-xl">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 text-sm text-white bg-primary rounded-xl disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      </form>
    </ModalShell>
  );
}

export function ManageCategoriesModal({ open, onClose, categories = [], onSave, saving, error = "" }) {
  return open ? (
    <ManageCategoriesForm
      key={JSON.stringify(categories.map(({ key, name, budget }) => [key, name, budget]))}
      onClose={onClose}
      categories={categories}
      onSave={onSave}
      saving={saving}
      error={error}
    />
  ) : null;
}

function ManageCategoriesForm({ onClose, categories, onSave, saving, error: serverError }) {
  const [rows, setRows] = useState(() => categoryBudgetDrafts(categories));
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const categoryId = useId();

  function updateRow(index, budget) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, budget } : r)));
    setError("");
  }

  function addCategory() {
    try {
      setRows(addCategoryBudgetDraft(rows, newName));
      setNewName("");
      setError("");
    } catch (issue) {
      setError(issue.message);
    }
  }

  function save(event) {
    event.preventDefault();
    if (saving) return;
    try {
      const finalRows = newName.trim() ? addCategoryBudgetDraft(rows, newName) : rows;
      const budgets = categoryBudgetsFromDrafts(finalRows);
      setError("");
      onSave(budgets);
    } catch (issue) {
      setError(issue.message);
    }
  }

  return (
    <ModalShell open title="Manage categories" onClose={onClose}>
      <Dialog.Description className="text-sm text-muted-foreground mb-4">Add the categories you want to plan for, set their limits, or remove them from this month’s plan.</Dialog.Description>
      <form onSubmit={save}>
      <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
        {rows.map((row, i) => (
          <div key={row.key} className="flex items-center gap-2">
            <span title={row.name} className="text-sm text-foreground flex-1 min-w-0 truncate">{row.name}</span>
            <input
              aria-label={`${row.name} budget (₹)`}
              type="text"
              inputMode="decimal"
              placeholder="Amount"
              disabled={saving}
              value={row.budget}
              onFocus={(event) => event.target.select()}
              onChange={(e) => updateRow(i, e.target.value)}
              className="w-28 px-2 py-1.5 text-sm border border-border rounded-lg"
            />
            <button type="button" aria-label={`Remove ${row.name} category`} disabled={saving} onClick={() => { setRows((previous) => previous.filter((item) => item.key !== row.key)); setError(""); }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-60"><Trash2 size={16} aria-hidden="true" /></button>
          </div>
        ))}
        {!rows.length && <p className="rounded-xl bg-muted px-3 py-4 text-sm text-muted-foreground">No categories in this plan. Add one below or save an empty plan.</p>}
      </div>
      <label htmlFor={categoryId} className="mb-1 block text-xs font-medium text-[#647268]">New category name</label>
      <div className="mb-4 flex gap-2">
        <input id={categoryId} value={newName} disabled={saving} maxLength={80} placeholder="For example, Travel" onChange={(event) => { setNewName(event.target.value); setError(""); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCategory(); } }} className="min-w-0 flex-1 rounded-xl border border-border px-3 py-2 text-sm" />
        <button type="button" onClick={addCategory} disabled={saving || !newName.trim()} className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"><Plus size={16} aria-hidden="true" />Add</button>
      </div>
      {(error || serverError) && <p role="alert" className="mb-3 text-sm text-red-600">{error || serverError}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-2.5 text-sm text-white bg-primary rounded-xl disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save category budgets"}
      </button>
      </form>
    </ModalShell>
  );
}

export function BudgetPlannerModal({ open, onClose, totalBudget, spent, savingsGoal, categories = [], onSave, saving, error = "" }) {
  return open ? (
    <BudgetPlannerForm
      key={JSON.stringify([totalBudget, spent, savingsGoal, categories.map((category) => category.key)])}
      onClose={onClose}
      totalBudget={totalBudget}
      spent={spent}
      savingsGoal={savingsGoal}
      categories={categories}
      onSave={onSave}
      saving={saving}
      error={error}
    />
  ) : null;
}

function BudgetPlannerForm({ onClose, totalBudget, spent, savingsGoal, categories, onSave, saving, error: serverError }) {
  const [total, setTotal] = useState(() => budgetAmountDraft(totalBudget));
  const [goal, setGoal] = useState(() => budgetAmountDraft(savingsGoal ?? 0));
  const [error, setError] = useState("");
  const totalId = useId();
  const goalId = useId();

  function autoSplit(event) {
    event.preventDefault();
    if (saving) return;
    try {
      const plan = buildBudgetPlannerSave(total, goal, categories);
      setError("");
      onSave(plan);
    } catch (issue) {
      setError(issue.message);
    }
  }

  return (
    <ModalShell open title="Budget planner" onClose={onClose}>
      <Dialog.Description className="text-sm text-muted-foreground mb-4">
        Plan total budget and savings goal. Spent so far: ₹{spent.toLocaleString("en-IN")}.
      </Dialog.Description>
      <form onSubmit={autoSplit}>
      <label htmlFor={totalId} className="block text-xs font-medium text-[#647268] mb-1">Total budget (₹)</label>
      <input
        id={totalId}
        type="text"
        inputMode="decimal"
        placeholder="Amount"
        disabled={saving}
        value={total}
        onFocus={(event) => event.target.select()}
        onChange={(e) => { setTotal(e.target.value); setError(""); }}
        className="w-full px-3 py-2 text-sm border border-border rounded-xl mb-3"
      />
      <label htmlFor={goalId} className="block text-xs font-medium text-[#647268] mb-1">Savings goal (₹)</label>
      <input
        id={goalId}
        type="text"
        inputMode="decimal"
        placeholder="Amount"
        disabled={saving}
        value={goal}
        onFocus={(event) => event.target.select()}
        onChange={(e) => { setGoal(e.target.value); setError(""); }}
        className="w-full px-3 py-2 text-sm border border-border rounded-xl mb-4"
      />
      {!categories.length && <p className="mb-3 text-sm text-muted-foreground">Add a category in Manage Categories before splitting your budget.</p>}
      {(error || serverError) && <p role="alert" className="mb-3 text-sm text-red-600">{error || serverError}</p>}
      <button
        type="submit"
        disabled={saving || !categories.length}
        className="w-full py-2.5 text-sm text-white bg-primary rounded-xl disabled:opacity-60"
      >
        {saving ? "Saving…" : "Auto-split & save"}
      </button>
      </form>
    </ModalShell>
  );
}
