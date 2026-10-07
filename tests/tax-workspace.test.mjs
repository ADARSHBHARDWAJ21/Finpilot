import test from "node:test";
import assert from "node:assert/strict";
import { estimateTax, simulateTaxChange } from "../src/lib/copilot/tax-engine.js";
import { buildCopilotContext } from "../src/lib/copilot/context.js";
import { buildFinanceReport } from "../src/lib/finance/reports.js";
import { defaultDetails, detailSchemas } from "../src/lib/finance/model.js";
import { taxReconciliation } from "../src/lib/taxation/year-inputs.js";

const inputs = { financialYear: "2025-26", annualSalary: 1500000, age: 35, annualBasic: 600000, deductionConflicts: [], governmentEmployer: false, salaryIsCtcProxy: false };
const profile = { financial_year: "2026-27", annual_ctc: 3000000, basic_salary: 100000, age: 35, epf: 150000 };
function workspace(year = "2025-26") {
  return { year, documents: [], sections: {
    "salary-documents": { details: { ...defaultDetails("salary-documents"), annualSalary: 1800000, annualBasic: 600000, annualHra: 240000, age: 35 } },
    "tax-saving-proofs": { details: { ...defaultDetails("tax-saving-proofs"), section80c: 100000, personalNps: 50000, eligibilityConfirmed: true } },
    "compliance-filing": { details: { ...defaultDetails("compliance-filing"), regime: "new", annualTds: 100000, advanceTax: 0 } },
  } };
}

test("resident senior age bands and non-resident rebates use the correct rules", () => {
  assert.equal(estimateTax(inputs).old.tax, 257400);
  assert.equal(estimateTax({ ...inputs, age: 65 }).old.tax, 254800);
  assert.equal(estimateTax({ ...inputs, age: 80 }).old.tax, 244400);
  assert.equal(estimateTax({ ...inputs, age: 80, resident: false }).old.tax, 257400);
  const nonresident = estimateTax({ ...inputs, annualSalary: 550000, resident: false });
  assert.equal(nonresident.old.tax, 13000);
  assert.equal(nonresident.new.tax, 3900);
  assert.equal(nonresident.new.rebate, 0);
});

test("salary surcharge includes marginal relief at the threshold and regime-specific ceilings", () => {
  assert.equal(estimateTax({ ...inputs, annualSalary: 6000000 }).new.tax, 1552980);
  const edge = estimateTax({ ...inputs, annualSalary: 5076000 }).new;
  assert.equal(edge.taxableIncome, 5001000);
  assert.equal(edge.tax, 1124240);
  assert.ok(edge.surchargeRelief > 0);
  const high = estimateTax({ ...inputs, annualSalary: 60000000 });
  assert.equal(high.new.surcharge, Math.round(high.new.baseTax * .25));
  assert.equal(high.old.surcharge, Math.round(high.old.baseTax * .37));
});

test("self/family and parents senior limits are separate and remain capped", () => {
  const result = estimateTax({ ...inputs, healthInsurance: 80000, parentsHealthInsurance: 70000, selfFamilySenior: true, parentsSenior: true });
  assert.equal(result.old.deductions.healthInsurance, 100000);
  assert.equal(result.new.deductions.healthInsurance, undefined);
  const nonresident = estimateTax({ ...inputs, age: 65, resident: false, healthInsurance: 50000 });
  assert.equal(nonresident.old.deductions.healthInsurance, 25000);
  const coveredResidentSpouse = estimateTax({ ...inputs, age: 65, resident: false, healthInsurance: 50000, selfFamilySenior: true });
  assert.equal(coveredResidentSpouse.old.deductions.healthInsurance, 50000);
});

test("historical salary and deductions match Copilot and reports without importing current-year values", () => {
  const saved = workspace();
  const base = { profile, workspace: saved, salary: null, deductions: [{ key: "80C", amount: 90000 }], transactions: [] };
  const report = buildFinanceReport(base);
  const ai = buildCopilotContext({ ...base, budgets: [], today: "2026-10-07", start: "2026-05-01" });
  assert.equal(report.tax.annualSalary, 1800000);
  assert.equal(report.taxInputs.section80c, 100000);
  assert.deepEqual(report.tax, ai.context.tax);
  assert.equal(report.tax.available, true);
  assert.equal(report.tax.new.tax, 150800);
  assert.equal(report.reconciliation.balance, 50800);
  assert.equal(report.reconciliation.excess, 0);
  assert.equal(ai.context.deductionSources[0].profileDeclaredAmount, 0);
  assert.deepEqual(ai.context.deductionRecords, []);
});

test("confirmed salary supersedes legacy filing salary and annual employer NPS resolves old units", () => {
  const saved = workspace("2026-27");
  saved.sections["compliance-filing"].details.annualSalary = 999999;
  saved.sections["salary-documents"].details.employerNps = 80000;
  saved.sections["salary-documents"].details.annualDa = 120000;
  const report = buildFinanceReport({ profile, salary: { employer_nps: 5000 }, workspace: saved });
  assert.equal(report.tax.annualSalary, 1800000);
  assert.equal(report.taxInputs.annualBasic, 720000);
  assert.equal(report.tax.old.deductions.employerNps, 72000);
  assert.equal(report.tax.new.deductions.employerNps, 80000);
});

test("confirmed annual deduction totals resolve duplicates without adding rows again", () => {
  const saved = workspace("2026-27");
  const report = buildFinanceReport({ profile, workspace: saved, deductions: [{ key: "80C", amount: 150000 }, { key: "80C", amount: 150000 }] });
  assert.equal(report.tax.old.deductions.section80c, 100000);
  assert.equal(report.taxInputs.deductionConflicts.length, 0);
});

test("blank payments stay unknown, explicit zero is reconciled, and a regime is required", () => {
  const tax = estimateTax(inputs);
  assert.equal(taxReconciliation(tax, { regime: "new", annualTds: null, advanceTax: 0 }).available, false);
  assert.equal(taxReconciliation(tax, { regime: "undecided", annualTds: 0, advanceTax: 0 }).available, false);
  assert.equal(taxReconciliation(tax, { regime: "new", annualTds: 0, advanceTax: 0 }).balance, tax.new.tax);
  assert.equal(taxReconciliation(tax, { regime: "new", annualTds: tax.new.tax + 1000, advanceTax: 0 }).excess, 1000);
});

test("tax detail validation rejects negative values, ambiguous eligibility and impossible salary components", () => {
  assert.equal(detailSchemas["salary-documents"].safeParse({ ...defaultDetails("salary-documents"), annualSalary: 100, annualBasic: 200 }).success, false);
  assert.equal(detailSchemas["tax-saving-proofs"].safeParse(defaultDetails("tax-saving-proofs")).success, false);
  assert.equal(detailSchemas["tax-saving-proofs"].safeParse({ ...defaultDetails("tax-saving-proofs"), section80c: -1, eligibilityConfirmed: true }).success, false);
  assert.equal(detailSchemas["salary-documents"].safeParse(workspace().sections["salary-documents"].details).success, true);
});

test("a rent simulation recomputes HRA instead of reusing the saved exemption", () => {
  const result = simulateTaxChange({ ...inputs, annualHra: 240000, annualRent: 300000, confirmedHraExemption: 240000, metro: true }, { monthlyRent: 10000 });
  assert.equal(result.baseline.old.deductions.hra, 240000);
  assert.equal(result.scenario.old.deductions.hra, 60000);
  const saved = workspace();
  saved.sections["rent-hra"] = { details: { ...defaultDetails("rent-hra"), payingRent: true, basicMonthly: 50000, daMonthly: 5000, commissionMonthly: 5000, hraMonthly: 20000, rentMonthly: 25000, months: 6, city: "Mumbai" } };
  const report = buildFinanceReport({ profile, workspace: saved });
  const shorter = simulateTaxChange(report.taxInputs, { monthlyRent: 10000 });
  assert.equal(shorter.baseline.old.deductions.hra, 114000);
  assert.equal(shorter.scenario.old.deductions.hra, 24000);
  assert.equal(shorter.scenario.old.deductions.employerNps, 0);
});
