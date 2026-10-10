"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import { addManualTransaction } from "@/app/transactions/actions";

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Utilities",
  "Income",
  "Other",
];

const PAYMENT_METHODS = [
  "UPI",
  "Credit Card",
  "Debit Card",
  "Cash",
  "Net Banking",
  "Unknown",
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddTransactionModal(props) {
  return props.open ? <TransactionForm key={props.defaultType || "expense"} {...props} /> : null;
}

function TransactionForm({ open, onClose, defaultType = "expense" }) {
  const router = useRouter();
  const [type, setType] = useState(defaultType);
  const [date, setDate] = useState(todayIso);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(
    defaultType === "income" ? "Income" : "Other"
  );
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleTypeChange(nextType) {
    setType(nextType);
    if (nextType === "income" && category === "Other") {
      setCategory("Income");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const result = await addManualTransaction({
        date,
        description,
        amount,
        type,
        category,
        payment_method: paymentMethod,
      });

      if (result.count === 0) {
        setError(result.message || "This transaction already exists.");
        return;
      }

      router.refresh();
      onClose();
      setDescription("");
      setAmount("");
      setDate(todayIso());
      setCategory(type === "income" ? "Income" : "Other");
    } catch (err) {
      setError(err.message || "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !saving) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#10211c]/45 backdrop-blur-sm" />
      <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-xl border border-border max-h-[90dvh] overflow-y-auto outline-none">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <Dialog.Title className="text-xl font-medium text-foreground">Add transaction</Dialog.Title>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} aria-busy={saving} className="p-6 space-y-4">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange("expense")}
              aria-pressed={type === "expense"}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                type === "expense"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              aria-pressed={type === "income"}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                type === "income"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Income
            </button>
          </div>

          <div>
            <label htmlFor="transaction-date" className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
            <input
              id="transaction-date" type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="fp-input"
            />
          </div>

          <div>
            <label htmlFor="transaction-description" className="block text-xs font-medium text-gray-600 mb-1">
              Description
            </label>
            <input
              id="transaction-description" aria-label="Description" type="text"
              required
              placeholder="e.g. Zomato order, Salary credit"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="fp-input"
            />
          </div>

          <div>
            <label htmlFor="transaction-amount" className="block text-xs font-medium text-gray-600 mb-1">
              Amount (₹)
            </label>
            <input
              id="transaction-amount" aria-label="Amount in rupees" type="number"
              required
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="fp-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Category
              </label>
              <select
                aria-label="Category" value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="fp-input bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Payment
              </label>
              <select
                aria-label="Payment method" value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="fp-input bg-white"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
