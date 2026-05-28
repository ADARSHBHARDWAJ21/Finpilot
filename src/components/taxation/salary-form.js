"use client";

import { useMemo, useState } from "react";
import {
  addDeduction,
  deleteDeduction,
  saveSalaryProfile,
  updateDeduction,
} from "@/app/taxation/actions";
import { compareRegimes } from "@/lib/tax/compare-regimes";
import { DEDUCTIONS } from "@/constants/deductions";
import { calculateDeductionUtilization } from "@/lib/tax/deduction-utilization";

const initialState = {
  annual_ctc: "",
  basic_salary: "",
  hra: "",
  special_allowance: "",
  bonus: "",
  employer_pf: "",
  employer_nps: "",
  tax_regime: "new",
};

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function totalByKey(rows, key) {
  return (rows || [])
    .filter((r) => r.key === key)
    .reduce((sum, r) => sum + toNumber(r.amount), 0);
}

export default function SalaryForm({
  initialProfile,
  initialDeductions,
  initialTaxCalculation,
}) {
  const [formData, setFormData] = useState(() => ({
    ...initialState,
    ...(initialProfile || {}),
    tax_regime: initialProfile?.tax_regime || "new",
  }));
  const [deductions, setDeductions] = useState(initialDeductions || []);
  const [newDeduction, setNewDeduction] = useState({ key: "80C", amount: "" });
  const [status, setStatus] = useState(null);
  const [deductionStatus, setDeductionStatus] = useState(null);

  const compareInput = useMemo(
    () => ({
      annual_ctc: toNumber(formData.annual_ctc),
      section80c: totalByKey(deductions, "80C"),
      nps: totalByKey(deductions, "80CCD_1B"),
      hra_exemption: toNumber(formData.hra),
    }),
    [formData.annual_ctc, formData.hra, deductions]
  );

  const liveResult = useMemo(() => compareRegimes(compareInput), [compareInput]);
  const taxResult = initialTaxCalculation
    ? {
        oldResult: {
          taxableIncome:
            initialTaxCalculation.old_taxable_income ?? liveResult.oldResult.taxableIncome,
          tax: initialTaxCalculation.old_regime_tax ?? liveResult.oldResult.tax,
        },
        newResult: {
          taxableIncome:
            initialTaxCalculation.new_taxable_income ?? liveResult.newResult.taxableIncome,
          tax: initialTaxCalculation.new_regime_tax ?? liveResult.newResult.tax,
        },
        recommended: initialTaxCalculation.recommended_regime ?? liveResult.recommended,
        savings: initialTaxCalculation.tax_savings ?? liveResult.savings,
      }
    : liveResult;

  const deductionSummary = useMemo(
    () => calculateDeductionUtilization(deductions),
    [deductions]
  );

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "pending" });

    try {
      const payload = {
        ...formData,
        section80c: totalByKey(deductions, "80C"),
        nps: totalByKey(deductions, "80CCD_1B"),
      };
      await saveSalaryProfile(payload);
      setStatus({ type: "success" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function handleAddDeduction(e) {
    e.preventDefault();
    setDeductionStatus({ type: "pending" });
    try {
      const created = await addDeduction(newDeduction);
      setDeductions((prev) => [created, ...prev]);
      setNewDeduction({ key: newDeduction.key, amount: "" });
      setDeductionStatus({ type: "success" });
    } catch (error) {
      setDeductionStatus({ type: "error", message: error.message });
    }
  }

  async function handleUpdateDeduction(id, key, amount) {
    setDeductionStatus({ type: "pending" });
    try {
      const updated = await updateDeduction(id, { key, amount });
      setDeductions((prev) => prev.map((item) => (item.id === id ? updated : item)));
      setDeductionStatus({ type: "success" });
    } catch (error) {
      setDeductionStatus({ type: "error", message: error.message });
    }
  }

  async function handleDeleteDeduction(id) {
    setDeductionStatus({ type: "pending" });
    try {
      await deleteDeduction(id);
      setDeductions((prev) => prev.filter((item) => item.id !== id));
      setDeductionStatus({ type: "success" });
    } catch (error) {
      setDeductionStatus({ type: "error", message: error.message });
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
        >
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Annual CTC</label>
            <input
              name="annual_ctc"
              type="number"
              placeholder="e.g. 1800000"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
              value={formData.annual_ctc}
              onChange={handleChange}
              required
            />
          </div>

          {[
            ["basic_salary", "Basic Salary"],
            ["hra", "HRA"],
            ["special_allowance", "Special Allowance"],
            ["bonus", "Bonus"],
            ["employer_pf", "Employer PF (annual)"],
            ["employer_nps", "Employer NPS (annual)"],
          ].map(([name, label]) => (
            <div key={name}>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">{label}</label>
              <input
                name={name}
                type="number"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                value={formData[name]}
                onChange={handleChange}
              />
            </div>
          ))}

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Preferred Tax Regime</label>
            <div className="flex gap-2">
              {["new", "old"].map((regime) => (
                <button
                  key={regime}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, tax_regime: regime }))}
                  className={`px-3 py-1.5 rounded-full text-xs border ${
                    formData.tax_regime === regime
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  {regime === "new" ? "New Regime" : "Old Regime"}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center gap-3 mt-2">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              Save Salary Profile
            </button>
            {status?.type === "success" && (
              <span className="text-xs text-emerald-600">Salary profile and taxes saved.</span>
            )}
            {status?.type === "error" && (
              <span className="text-xs text-red-600">Error: {status.message}</span>
            )}
          </div>
        </form>

        <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Tax Summary (Core Engine)</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Taxable income (old)</dt>
              <dd className="font-semibold text-gray-900">
                ?{Math.round(taxResult.oldResult.taxableIncome).toLocaleString("en-IN")}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Taxable income (new)</dt>
              <dd className="font-semibold text-gray-900">
                ?{Math.round(taxResult.newResult.taxableIncome).toLocaleString("en-IN")}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Old regime tax</dt>
              <dd className="font-semibold text-gray-900">
                ?{Math.round(taxResult.oldResult.tax).toLocaleString("en-IN")}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">New regime tax</dt>
              <dd className="font-semibold text-gray-900">
                ?{Math.round(taxResult.newResult.tax).toLocaleString("en-IN")}
              </dd>
            </div>
            <div className="flex justify-between gap-4 pt-2 border-t border-gray-100 mt-2">
              <dt className="text-gray-700 font-semibold">Recommended regime</dt>
              <dd className="font-semibold text-indigo-600 capitalize">{taxResult.recommended}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-700 font-semibold">Estimated savings</dt>
              <dd className="font-semibold text-emerald-600">
                ?{Math.round(taxResult.savings).toLocaleString("en-IN")}
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Deduction Engine</h2>

        <form className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 mb-4" onSubmit={handleAddDeduction}>
          <select
            value={newDeduction.key}
            onChange={(e) => setNewDeduction((prev) => ({ ...prev, key: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
          >
            {DEDUCTIONS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.key}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Amount"
            value={newDeduction.amount}
            onChange={(e) => setNewDeduction((prev) => ({ ...prev, amount: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            required
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            Add deduction
          </button>
        </form>

        {deductionStatus?.type === "error" && (
          <p className="text-xs text-red-600 mb-3">Error: {deductionStatus.message}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[620px]">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="py-2.5">Section</th>
                <th className="py-2.5">Amount</th>
                <th className="py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deductions.map((row) => (
                <DeductionRow
                  key={row.id}
                  row={row}
                  onSave={handleUpdateDeduction}
                  onDelete={handleDeleteDeduction}
                />
              ))}
              {deductions.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-sm text-gray-400">
                    No deductions added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          {deductionSummary.map((d) => (
            <div key={d.key} className="rounded-xl border border-gray-100 p-3 bg-gray-50/60">
              <p className="text-xs font-semibold text-gray-800">{d.key}</p>
              <p className="text-xs text-gray-500 mt-1">
                Used: ?{d.used.toLocaleString("en-IN")} / ?{d.limit.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-indigo-600 mt-1">
                Remaining: ?{d.remaining.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Potential savings: ?{d.potentialSavings.toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DeductionRow({ row, onSave, onDelete }) {
  const [key, setKey] = useState(row.key);
  const [amount, setAmount] = useState(String(row.amount ?? ""));
  const [saving, setSaving] = useState(false);

  return (
    <tr className="border-b border-gray-50">
      <td className="py-2.5">
        <select
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
        >
          {DEDUCTIONS.map((d) => (
            <option key={d.key} value={d.key}>
              {d.key}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2.5">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-36"
        />
      </td>
      <td className="py-2.5">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
            onClick={async () => {
              setSaving(true);
              await onSave(row.id, key, amount);
              setSaving(false);
            }}
          >
            Save
          </button>
          <button
            type="button"
            className="px-2.5 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
            onClick={() => onDelete(row.id)}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
