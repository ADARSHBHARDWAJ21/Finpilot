import test from "node:test";
import assert from "node:assert/strict";
import { estimateTax, profileTaxInputs, simulateTaxChange } from "../src/lib/copilot/tax-engine.js";
import { buildCopilotContext, loadCopilotContext } from "../src/lib/copilot/context.js";
import { executeCopilotTool } from "../src/lib/copilot/tools.js";
import { chatRequestSchema, taxChangeSchema, allowCopilotRequest } from "../src/lib/copilot/validation.js";
import { readCopilotChat, saveCopilotChat } from "../src/lib/copilot/chat-store.js";

const profile = { financial_year: "2025-26", annual_ctc: 1800000, age: 30, basic_salary: 50000, hra: 20000, city: "Bengaluru", monthly_inhand_salary: 110000, monthly_food_spend: 10000, monthly_transport_spend: 5000, monthly_shopping_spend: 8000 };
const inputs = () => profileTaxInputs(profile);
const context = () => buildCopilotContext({ profile, transactions: [], budgets: [], today: "2026-10-01", start: "2026-05-01" }).context;

test("new-regime rebate, marginal relief and cess around the zero-tax boundary", () => {
  assert.equal(estimateTax({ ...inputs(), annualSalary: 1275000 }).new.tax, 0);
  const above = estimateTax({ ...inputs(), annualSalary: 1300000 }).new;
  assert.equal(above.taxableIncome, 1225000);
  assert.equal(above.marginalRelief, 38750);
  assert.equal(above.tax, 26000);
});
test("slabs use the selected tax year, rather than the older fixed dashboard rules", () => {
  assert.equal(estimateTax(inputs()).new.tax, 150800);
  assert.equal(estimateTax({ ...inputs(), financialYear: "2024-25" }).new.tax, 215800);
  assert.equal(estimateTax({ ...inputs(), financialYear: "2026-27" }).new.tax, 150800);
  assert.equal(estimateTax({ ...inputs(), financialYear: "2027-28" }).available, false);
});
test("income rounds to ten before slabs and rebate; tax rounds after cess", () => {
  for (const financialYear of ["2024-25", "2025-26", "2026-27"]) {
    assert.equal(estimateTax({ ...inputs(), financialYear, annualSalary: 550001 }).old.tax, 0);
    assert.equal(estimateTax({ ...inputs(), financialYear, annualSalary: 550004.99 }).old.taxableIncome, 500000);
    assert.equal(estimateTax({ ...inputs(), financialYear, annualSalary: 550005 }).old.tax, 13000);
  }
  const tax = estimateTax({ ...inputs(), annualSalary: 1800009 });
  assert.equal(tax.new.taxableIncome, 1725010);
  assert.equal(tax.new.tax, 150800);
  assert.equal(tax.old.tax, 351000);
});
test("a requested tax year applies to both estimates without changing the saved year", () => {
  const account = context();
  const result = executeCopilotTool("compare_tax", { financialYear: "2024-25", increasePercent: 20, monthsRemaining: 6 }, account);
  assert.equal(result.baseline.financialYear, "2024-25");
  assert.equal(result.baseline.new.tax, 215800);
  assert.equal(result.scenario.financialYear, "2024-25");
  assert.equal(result.scenario.new.tax, 271960);
  assert.equal(account.taxInputs.financialYear, "2025-26");
  assert.ok(executeCopilotTool("compare_tax", { financialYear: "2027-28" }, context()).error);
});
test("promotion applies only for the stated months and does not mutate the profile", () => {
  const before = inputs();
  const result = simulateTaxChange(before, { increasePercent: 20, monthsRemaining: 6 });
  assert.equal(result.scenario.annualSalary, 1980000);
  assert.equal(result.delta.grossIncome, 180000);
  assert.equal(before.annualSalary, 1800000);
  assert.equal(result.scenario.new.tax, 188240);
});

test("confirmed current gross salary replaces CTC in a partial-year promotion", () => {
  const saved = { ...inputs(), annualSalary: 2000000 };
  const changes = { baselineAnnualSalary: 1800000, annualSalary: 2160000, monthsRemaining: 6 };
  const result = executeCopilotTool("compare_tax", changes, { taxInputs: saved });
  assert.equal(result.baseline.annualSalary, 1800000);
  assert.equal(result.scenario.annualSalary, 1980000);
  assert.equal(result.delta.grossIncome, 180000);
  assert.equal(result.scenario.new.tax, 188240);
  assert.ok(!result.baseline.warnings.some((warning) => warning.includes("CTC is used")));
  assert.ok(!result.scenario.warnings.some((warning) => warning.includes("CTC is used")));
  assert.equal(saved.annualSalary, 2000000);
  const percent = simulateTaxChange(saved, { baselineAnnualSalary: 1800000, increasePercent: 20, monthsRemaining: 6 });
  assert.equal(percent.scenario.annualSalary, 1980000);
  assert.ok(simulateTaxChange(saved, { annualSalary: 2160000, monthsRemaining: 6 }).scenario.warnings.some((warning) => warning.includes("CTC is used")));
  assert.equal(taxChangeSchema.safeParse({ baselineAnnualSalary: -1 }).success, false);
});
test("zero-valued overrides work and HRA uses rent minus ten percent of eligible salary", () => {
  const base = profileTaxInputs({ ...profile, paying_rent: true, monthly_rent: 20000, epf: 100000 });
  assert.equal(estimateTax(base).old.deductions.hra, 180000);
  const result = simulateTaxChange(base, { monthlyRent: 0, section80c: 0 });
  assert.equal(result.scenario.old.deductions.hra, 0);
  assert.equal(result.scenario.old.deductions.section80c, 0);
});
test("employer NPS is annualised from monthly profile values and separated from voluntary NPS", () => {
  const tax = estimateTax(profileTaxInputs({ ...profile, employer_nps: 7000, nps_contribution: 40000 }));
  assert.equal(tax.old.deductions.employerNps, 60000);
  assert.equal(tax.old.deductions.personalNps, 40000);
  assert.equal(tax.new.deductions.employerNps, 84000);
  assert.equal(tax.new.deductions.personalNps, undefined);
});

test("government employer NPS uses 14% in old regime only after confirmation", () => {
  const base = profileTaxInputs({ ...profile, employer_nps: 7000 });
  assert.equal(estimateTax(base).old.deductions.employerNps, 60000);
  assert.ok(estimateTax(base).warnings.some((warning) => warning.includes("Employer type is unconfirmed")));
  const result = executeCopilotTool("compare_tax", { governmentEmployer: true }, { taxInputs: base });
  assert.equal(result.scenario.old.deductions.employerNps, 84000);
  assert.equal(result.scenario.old.tax, 324790);
  assert.equal(result.scenario.new.deductions.employerNps, 84000);
  assert.equal(base.governmentEmployer, null);
  assert.equal(taxChangeSchema.safeParse({ governmentEmployer: "yes" }).success, false);
});

test("personal NPS allocates distinct contributions into the shared deduction pool", () => {
  const base = { ...inputs(), personalNps: 100000 };
  const tax = estimateTax(base);
  assert.equal(tax.old.deductions.personalNps, 50000);
  assert.equal(tax.old.deductions.personalNpsWithin80c, 50000);
  assert.equal(tax.old.tax, 319800);
  assert.equal(estimateTax({ ...base, section80c: 130000 }).old.deductions.personalNpsWithin80c, 20000);
  assert.equal(estimateTax({ ...base, section80c: 150000 }).old.deductions.personalNpsWithin80c, 0);
  assert.equal(estimateTax({ ...base, personalNps: 200000 }).old.deductions.personalNpsWithin80c, 60000);
  assert.equal(estimateTax({ ...base, annualBasic: 0 }).old.deductions.personalNpsWithin80c, 0);
  assert.equal(tax.new.deductions.personalNpsWithin80c, undefined);
});

test("ambiguous workspace employer NPS requires an explicit annual total", () => {
  const declared = { ...profile, employer_nps: 2500 };
  const matching = profileTaxInputs(declared, { employer_nps: 2500 });
  assert.equal(matching.employerNps, 30000);
  assert.equal(estimateTax(matching).available, true);
  const ambiguous = profileTaxInputs(declared, { employer_nps: 30000 });
  assert.equal(ambiguous.employerNps, 0);
  assert.equal(estimateTax(ambiguous).available, false);
  const confirmed = simulateTaxChange(ambiguous, { employerNps: 30000 });
  assert.equal(confirmed.baseline.available, false);
  assert.equal(confirmed.scenario.new.deductions.employerNps, 30000);
  assert.equal(confirmed.scenario.new.tax, 144560);
  assert.equal(confirmed.delta, null);
  assert.equal(ambiguous.employerNpsUnconfirmed, true);
  assert.equal(simulateTaxChange(ambiguous, { employerNps: 0 }).scenario.available, true);
});

test("conflicting deductions remain unavailable until all relevant annual totals are confirmed", () => {
  const deductionConflicts = [{ key: "80C" }, { key: "80CCD_1B" }, { key: "80D" }];
  const base = { ...inputs(), deductionConflicts };
  assert.equal(estimateTax(base).available, false);
  assert.equal(simulateTaxChange(base, { section80c: 100000, personalNps: 20000, healthInsurance: 0 }).scenario.available, false);
  const confirmed = simulateTaxChange(base, { section80c: 100000, personalNps: 20000, healthInsurance: 0, parentsHealthInsurance: 0 });
  assert.equal(confirmed.scenario.available, true);
  assert.equal(confirmed.scenario.old.deductions.section80c, 100000);
  assert.equal(confirmed.scenario.old.deductions.personalNps, 20000);
  assert.equal(deductionConflicts.length, 3);
});
test("supported senior and surcharge estimates still exclude unconfirmed loan claims", () => {
  assert.equal(estimateTax({ ...inputs(), age: 65 }).available, true);
  assert.equal(estimateTax({ ...inputs(), annualSalary: 6000000 }).available, true);
  assert.equal(estimateTax({ ...inputs(), annualSalary: 100000001 }).available, false);
  const tax = estimateTax(profileTaxInputs({ ...profile, home_loan_interest: 200000, education_loan_interest: 30000 }));
  assert.equal(tax.old.deductions.homeLoanInterest, 0);
  assert.equal(tax.old.deductions.educationLoanInterest, 0);
  assert.ok(tax.warnings.some((warning) => warning.includes("Home-loan")));
});
test("client cannot supply another user or financial snapshot, and invalid model inputs are rejected", () => {
  assert.equal(chatRequestSchema.safeParse({ message: "hi", userId: "other" }).success, false);
  assert.equal(chatRequestSchema.safeParse({ message: "hi", context: { annualSalary: 1 } }).success, false);
  assert.equal(chatRequestSchema.safeParse({ message: " " }).success, false);
  assert.equal(taxChangeSchema.safeParse({ annualSalary: -1 }).success, false);
  assert.equal(taxChangeSchema.safeParse({ annualSalary: 2000000, increasePercent: 10 }).success, false);
  assert.equal(taxChangeSchema.safeParse({ monthsRemaining: 13 }).success, false);
  assert.ok(executeCopilotTool("delete_user_data", {}, context()).error);
});
test("EMI handles zero interest and shows declared cashflow without affordability promises", () => {
  const result = executeCopilotTool("calculate_emi", { principal: 120000, annualRatePercent: 0, tenureMonths: 12 }, context());
  assert.equal(result.monthlyEmi, 10000);
  assert.equal(result.totalInterest, 0);
  assert.equal(result.remainingAfterEmi, 77000);
  assert.ok(executeCopilotTool("calculate_emi", { principal: 100, annualRatePercent: 10, tenureMonths: 0 }, context()).error);
});
test("context contains category aggregates, not PII, merchant descriptions or fabricated documents", () => {
  const built = buildCopilotContext({ profile: { ...profile, full_name: "Private Name", email: "private@example.com", phone_number: "SECRET_PHONE", user_id: "SECRET_USER", documents: { form_16: true } }, transactions: [{ transaction_date: "2026-10-01", type: "expense", amount: 500, category: "Food", description: "SECRET_MERCHANT" }], budgets: [], today: "2026-10-01", start: "2026-05-01" });
  const serialized = JSON.stringify(built.context);
  for (const secret of ["Private Name", "private@example.com", "SECRET_PHONE", "SECRET_USER", "SECRET_MERCHANT"]) assert.ok(!serialized.includes(secret));
  assert.equal(built.context.spending.currentMonth.expenses, 500);
  assert.ok(built.context.documentAvailability.includes("No Form 16"));
});
test("missing transaction data is unavailable, rather than a misleading zero-spend claim", () => {
  assert.equal(buildCopilotContext({ profile, transactions: null, today: "2026-10-01" }).context.spending.available, false);
});

function fakeDb(results = {}) {
  const calls = [];
  return { calls, from(table) {
    const record = { table, filters: [], write: null }; calls.push(record);
    const query = {
      select() { return query; }, eq(key, value) { record.filters.push([key, value]); return query; },
      gte() { return query; }, lte() { return query; }, in() { return query; }, order() { return query; }, limit() { return query; }, range() { return query; },
      maybeSingle() { return Promise.resolve(results[table] || { data: null }); },
      insert(payload) { record.write = payload; return query; }, update(payload) { record.write = payload; return query; },
      then(resolve, reject) { return Promise.resolve(results[table] || { data: [] }).then(resolve, reject); },
    }; return query;
  } };
}
test("every financial query is scoped to the authenticated user", async () => {
  const db = fakeDb({ onboarding_profiles: { data: profile } });
  const result = await loadCopilotContext(db, "signed-in-user", new Date("2026-09-30T20:00:00Z"));
  assert.equal(result.context.asOf, "2026-10-01");
  for (const call of db.calls) assert.ok(call.filters.some(([key, value]) => key === "user_id" && value === "signed-in-user"), call.table);
});
test("chat reads/writes stay within account ownership; missing chat returns 404", async () => {
  const db = fakeDb();
  await assert.rejects(readCopilotChat(db, "owner", "chat-id"), (error) => error.status === 404);
  assert.deepEqual(db.calls[0].filters, [["user_id", "owner"], ["id", "chat-id"]]);
  const write = fakeDb({ copilot_chats: { data: { id: "saved" } } });
  await saveCopilotChat(write, "owner", null, "Question", { answer: "Answer", calculations: [], sources: [] });
  assert.equal(write.calls[0].write.user_id, "owner");
  const concurrent = fakeDb();
  await assert.rejects(saveCopilotChat(concurrent, "owner", { id: "chat", messages: [], updated_at: "old" }, "Question", { answer: "Answer", calculations: [], sources: [] }), (error) => error.code === "CHAT_CHANGED");
  assert.ok(concurrent.calls[0].filters.some(([key, value]) => key === "updated_at" && value === "old"));
});
test("per-account burst limits reset after a minute", () => {
  for (let i = 0; i < 8; i++) assert.equal(allowCopilotRequest("limit-test", 100000), true);
  assert.equal(allowCopilotRequest("limit-test", 100000), false);
  assert.equal(allowCopilotRequest("another-account", 100000), true);
  assert.equal(allowCopilotRequest("limit-test", 160001), true);
});
