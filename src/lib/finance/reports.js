import {
  yearDates,
  defaultDetails,
  calculateHra,
  csvExport,
  indiaToday,
  CHECKLIST_IDS,
} from "./model.js";
import { buildCopilotContext } from "../copilot/context.js";
import { taxReconciliation } from "../taxation/year-inputs.js";

export function buildFinanceReport({
  profile = {},
  salary = null,
  deductions = [],
  workspace,
  transactions = [],
}) {
  const year = workspace.year,
    range = yearDates(year);
  const rows = transactions.filter((row) => {
    const date = String(row.transaction_date).slice(0, 10);
    return date >= range.start && date <= range.end;
  });
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(Date.UTC(Number(year.slice(0, 4)), i + 3, 1));
    return {
      month: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
      income: 0,
      expenses: 0,
    };
  });
  const categories = new Map();
  for (const row of rows) {
    const month = months.find(
      (m) => m.month === String(row.transaction_date).slice(0, 7),
    );
    const value = Math.round(Math.abs(Number(row.amount) || 0) * 100) / 100;
    if (row.type === "income") month.income += value;
    if (row.type === "expense") {
      month.expenses += value;
      const category = String(row.category || "Uncategorized");
      categories.set(category, (categories.get(category) || 0) + value);
    }
  }
  const details = (section) => ({
    ...defaultDetails(section, profile, salary, year),
    ...workspace.sections[section]?.details,
  });
  const filing = details("compliance-filing"),
    banking = details("banking-investments"),
    rent = details("rent-hra");
  const hra = calculateHra(rent, year);
  const { context } = buildCopilotContext({
    profile, salary, deductions, workspace, transactions: [], budgets: [],
    today: indiaToday(), start: range.start,
  });
  const tax = context.tax;
  const reconciliation = taxReconciliation(tax, filing);
  const checklist = Object.entries(CHECKLIST_IDS).map(([section, ids]) => ({
    section,
    completed: ids.filter(
      (id) => workspace.sections[section]?.checklist?.[id] === true,
    ).length,
    total: ids.length,
  }));
  return {
    year,
    range,
    asOf: indiaToday(),
    transactions: rows,
    months,
    categories: [...categories]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount),
    income: months.reduce((s, m) => s + m.income, 0),
    expenses: months.reduce((s, m) => s + m.expenses, 0),
    filing,
    banking,
    rent,
    hra,
    tax,
    taxInputs: context.taxInputs,
    dataWarnings: context.dataWarnings,
    reconciliation,
    checklist,
    documents: workspace.documents,
  };
}
export function transactionCsv(report) {
  return csvExport([
    ["Date", "Description", "Category", "Type", "Amount (INR)"],
    ...report.transactions.map((row) => [
      row.transaction_date,
      row.description || row.merchant || "",
      row.category,
      row.type,
      row.amount,
    ]),
  ]);
}
export function summaryRows(report) {
  const money = (n) =>
    `INR ${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  return [
    ["Financial year", report.year],
    ["Period", `${report.range.start} to ${report.range.end}`],
    ["Generated", report.asOf],
    ["Recorded transactions", report.transactions.length],
    ["Recorded income", money(report.income)],
    ["Recorded expenses", money(report.expenses)],
    ["Net recorded cashflow", money(report.income - report.expenses)],
    ["Filing status (self-reported)", report.filing.status],
    ["Selected regime", report.filing.regime],
    ["Filing date", report.filing.filedDate || "Not supplied"],
    [
      "Annual TDS (declared)",
      report.filing.annualTds === null
        ? "Not supplied"
        : money(report.filing.annualTds),
    ],
    [
      "Advance tax (declared)",
      report.filing.advanceTax === null
        ? "Not supplied"
        : money(report.filing.advanceTax),
    ],
    ["HRA old-regime estimate", money(report.hra.exemption)],
    ["Private documents", report.documents.length],
    ...(report.tax.available
      ? [
          ["Old regime salary-only estimate", money(report.tax.old.tax)],
          ["New regime salary-only estimate", money(report.tax.new.tax)],
          ...["old", "new"].flatMap((regime) => [
            [`${regime} regime taxable income`, money(report.tax[regime].taxableIncome)],
            [`${regime} regime rebate`, money(report.tax[regime].rebate)],
            [`${regime} regime surcharge after relief`, money(report.tax[regime].surcharge - report.tax[regime].surchargeRelief)],
            [`${regime} regime cess`, money(report.tax[regime].cess)],
          ]),
          ...report.tax.warnings.map((w) => ["Estimate assumption", w]),
        ]
      : [["Salary estimate unavailable", report.tax.reason]]),
    ...(report.reconciliation.available ? [
      ["Balance against salary-only estimate", money(report.reconciliation.balance)],
      ["Excess payments against salary-only estimate (not an approved refund)", money(report.reconciliation.excess)],
    ] : [["Tax reconciliation", report.reconciliation.reason]]),
    [
      "Scope",
      "Cashflow totals use saved transactions only. Transfers and refunds may need categorization. Declarations are not verified tax credits. This report does not file an income-tax return or establish a refund.",
    ],
    ...report.months.map((m) => [
      m.label,
      `Income ${money(m.income)} | Expenses ${money(m.expenses)}`,
    ]),
    ...report.checklist.map((c) => [
      c.section,
      `${c.completed}/${c.total} manually reviewed`,
    ]),
  ];
}
