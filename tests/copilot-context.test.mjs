import test from "node:test";
import assert from "node:assert/strict";
import { buildCopilotContext } from "../src/lib/copilot/context.js";
import { validateCopilotMessages, readCopilotChat, saveCopilotChat } from "../src/lib/copilot/chat-store.js";
import { TAX_SOURCES, simulateTaxChange } from "../src/lib/copilot/tax-engine.js";
import { executeCopilotTool } from "../src/lib/copilot/tools.js";

const profile = { financial_year: "2025-26", annual_ctc: 1800000, age: 30, basic_salary: 50000, hra: 20000, city: "Bengaluru", monthly_inhand_salary: 110000, employment_type: "salaried" };
const snapshot = (options = {}) => buildCopilotContext({ profile, transactions: [], budgets: [], today: "2026-10-01", start: "2026-05-01", ...options });
const pair = (assistant = {}) => [{ role: "user", content: "Question" }, { role: "assistant", content: "Answer", calculations: [], sources: [], ...assistant }];
const invalid = (value) => assert.throws(() => validateCopilotMessages(value), (error) => error.code === "CHAT_INVALID_DATA" && error.status === 409);

test("Copilot preparation uses reviewed items from the selected tax workspace", () => {
  const built = snapshot({ workspace: { year: "2025-26", sections: {
    "salary-documents": { checklist: { form16: true, salary_slips: "true", unknown: true } },
    "rent-hra": { checklist: { lease: true } },
  }, documents: [] } });
  assert.deepEqual(built.view.preparation, { completed: 2, total: 21, yearEnd: "2026-03-31" });
  assert.equal("preparation" in built.context, false);
});

test("Copilot does not invent preparation progress when the workspace is unavailable", () => {
  assert.equal(snapshot().view.preparation, null);
});

test("an independent workspace deduction requires confirmation and exposes both sources", () => {
  const built = snapshot({ deductions: [{ key: "80C", amount: 150000 }] });
  assert.equal(built.context.taxInputs.section80c, 0);
  assert.equal(built.context.tax.available, false);
  assert.equal(built.context.taxInputs.deductionConflicts[0].key, "80C");
  assert.equal(built.context.deductionSources[0].profileDeclaredAmount, 0);
  assert.deepEqual(built.context.deductionSources[0].workspaceAmounts, [150000]);
  assert.ok(built.view.dataWarnings.some((warning) => warning.includes("₹1,50,000") && warning.includes("₹0")));
  assert.ok(!built.view.insights.some((insight) => insight.text.includes("limit is unused")));
});

test("duplicate synchronization rows are reported individually and never added", () => {
  const built = snapshot({ profile: { ...profile, epf: 100000 }, deductions: [{ key: "80C", amount: 100000 }, { key: "80C", amount: 100000 }] });
  const source = built.context.deductionSources[0];
  assert.equal(source.duplicateCount, 1);
  assert.deepEqual(source.workspaceAmounts, [100000, 100000]);
  assert.deepEqual(source.distinctWorkspaceAmounts, [100000]);
  assert.equal(built.context.taxInputs.section80c, 100000);
  assert.equal(built.context.tax.available, false);
  const confirmed = simulateTaxChange(built.context.taxInputs, { section80c: 100000 });
  assert.equal(confirmed.scenario.available, true);
  assert.equal(confirmed.baseline.available, false);
});

test("capped synchronization of an above-limit 80C declaration is compatible", () => {
  const built = snapshot({ profile: { ...profile, epf: 180000 }, deductions: [{ key: "80c", amount: 150000 }] });
  assert.deepEqual(built.context.taxInputs.deductionConflicts, []);
  assert.equal(built.context.tax.available, true);
  assert.equal(built.context.deductionSources[0].profileDeclaredAmount, 180000);
  assert.equal(built.context.deductionSources[0].profileAmount, 150000);
});

test("large repeated workspaces produce a bounded warning with an explicit row count", () => {
  const built = snapshot({ deductions: Array(1000).fill({ key: "80C", amount: 123456 }) });
  const warning = built.view.dataWarnings.find((item) => item.startsWith("80C needs confirmation"));
  assert.ok(warning.includes("1000 separate workspace row(s)"));
  assert.ok(warning.includes("first 5 shown"));
  assert.ok(warning.length < 600);
  assert.equal(built.context.deductionSources[0].workspaceAmounts.length, 1000);
});

test("insurance conflicts preserve the parent split and need both confirmed amounts", () => {
  const warnings = ["Existing warning"];
  const built = snapshot({ profile: { ...profile, health_insurance: 12000, parents_health_insurance: 18000 }, deductions: [{ key: "80D", amount: 50000 }], warnings });
  const source = built.context.deductionSources.find((item) => item.key === "80D");
  assert.equal(source.profileSelfFamilyAmount, 12000);
  assert.equal(source.profileParentsAmount, 18000);
  assert.deepEqual(warnings, ["Existing warning"]);
  assert.equal(simulateTaxChange(built.context.taxInputs, { healthInsurance: 20000 }).scenario.available, false);
  assert.equal(simulateTaxChange(built.context.taxInputs, { healthInsurance: 20000, parentsHealthInsurance: 30000 }).scenario.available, true);
});

test("stored history rejects broken pairs, wrong roles, oversized text and unknown fields", () => {
  for (const messages of [[null, null], [{ role: "user", content: "Unanswered" }], pair().reverse(), pair({ content: "x".repeat(16001) }), pair({ secret: "unexpected" }), [...pair(), ...Array(40).fill({ role: "user", content: "Too many" })]]) invalid(messages);
  invalid([{ role: "user", content: "x".repeat(3001) }, pair()[1]]);
  invalid(pair({ createdAt: "2026-99-99T00:00:00Z" }));
  invalid(pair({ calculations: [{ kind: "tax", baseline: { available: true }, scenario: { available: true } }] }));
  invalid(pair({ calculations: Array(9).fill({ kind: "emi" }) }));
});

test("stored source links are restricted to supplied official references", () => {
  for (const url of ["javascript:alert(1)", "https://example.com/", `${TAX_SOURCES[0].url}?extra=1`]) invalid(pair({ sources: [{ title: "Reference", url }] }));
  const clean = validateCopilotMessages(pair({ sources: [{ title: "Modified title", url: TAX_SOURCES[0].url }] }));
  assert.deepEqual(clean[1].sources, [TAX_SOURCES[0]]);
});

test("genuine calculator results survive normalization including valid large loans", () => {
  const context = snapshot().context;
  const tax = executeCopilotTool("compare_tax", {}, context);
  const emi = executeCopilotTool("calculate_emi", { principal: 100000000, annualRatePercent: 60, tenureMonths: 480 }, context);
  const clean = validateCopilotMessages(pair({ calculations: [tax, emi], sources: TAX_SOURCES }));
  assert.equal(clean[1].calculations[0].scenario.new.tax, tax.scenario.new.tax);
  assert.equal(clean[1].calculations[1].totalInterest, emi.totalInterest);
  assert.ok(emi.totalInterest > 100000000);
  const untrusted = { ...emi, inputs: { ...emi.inputs, password: "do not retain" } };
  invalid(pair({ calculations: [untrusted] }));
  invalid(pair({ calculations: [{ ...emi, monthlyEmi: Infinity }] }));
});

function fakeDb(data) {
  const filters = [];
  const query = { select() { return query; }, eq(key, value) { filters.push([key, value]); return query; }, maybeSingle: async () => ({ data }), update() { return query; }, insert() { return query; } };
  return { filters, from() { return query; } };
}

test("malformed owned rows are rejected before returning or appending history", async () => {
  const malformed = fakeDb({ id: "chat", messages: [null, null] });
  await assert.rejects(readCopilotChat(malformed, "owner", "chat"), (error) => error.code === "CHAT_INVALID_DATA");
  assert.deepEqual(malformed.filters, [["user_id", "owner"], ["id", "chat"]]);
  await assert.rejects(saveCopilotChat(fakeDb({}), "owner", { id: "chat", messages: [null, null] }, "Question", { answer: "Answer" }), (error) => error.code === "CHAT_INVALID_DATA");
  const saved = await saveCopilotChat(fakeDb({ id: "saved" }), "owner", null, "Question", { answer: "Answer", calculations: [], sources: [] });
  assert.deepEqual(saved.messages.map((message) => message.role), ["user", "assistant"]);
});
