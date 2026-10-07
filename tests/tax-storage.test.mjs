import test from "node:test";
import assert from "node:assert/strict";
import { updateTaxSection, saveFilingReminder } from "../src/lib/finance/storage.js";
import { defaultDetails } from "../src/lib/finance/model.js";

// A database double that executes owner/year/version predicates against rows.
function database(initial = [], beforeWrite = () => {}) {
  const rows = structuredClone(initial);
  return { rows, from(table) {
    assert.equal(table, "tax_workspace_sections");
    let filters = [], operation = "read", payload;
    const query = {
      select() { return query; },
      eq(key, value) { filters.push([key, value]); return query; },
      update(value) { operation = "update"; payload = value; return query; },
      insert(value) { operation = "insert"; payload = value; return query; },
      async maybeSingle() {
        if (operation !== "read") beforeWrite(rows);
        const match = rows.find((row) => filters.every(([key, value]) => row[key] === value));
        if (operation === "update" && match) Object.assign(match, payload);
        if (operation === "insert") {
          if (rows.some((row) => ["user_id", "financial_year", "section"].every((key) => row[key] === payload[key]))) return { error: { code: "23505" } };
          rows.push({ details: {}, checklist: {}, ...payload });
          return { data: structuredClone(rows.at(-1)) };
        }
        return { data: match ? structuredClone(match) : null };
      },
    };
    return query;
  } };
}
const row = { user_id: "owner", financial_year: "2025-26", section: "salary-documents", details: { annualSalary: 1800000 }, checklist: { form16: true }, updated_at: "2026-10-01T12:00:00.000Z" };

test("saving details preserves checklists and isolates the account and financial year", async () => {
  const db = database([row, { ...row, user_id: "someone-else" }, { ...row, financial_year: "2024-25" }]);
  const result = await updateTaxSection(db, "owner", "2025-26", "salary-documents", "details", { annualSalary: 1900000 }, row.updated_at);
  assert.equal(result.section.details.annualSalary, 1900000);
  assert.deepEqual(result.section.checklist, { form16: true });
  assert.equal(db.rows[1].details.annualSalary, 1800000);
  assert.equal(db.rows[2].details.annualSalary, 1800000);
  assert.notEqual(result.section.updated_at, row.updated_at);
});

test("checklist updates preserve financial declarations and return the next save version", async () => {
  const db = database([row]);
  const result = await updateTaxSection(db, "owner", "2025-26", "salary-documents", "checklist", { form16: false }, row.updated_at);
  assert.deepEqual(result.section.details, row.details);
  await updateTaxSection(db, "owner", "2025-26", "salary-documents", "details", { annualSalary: 2000000 }, result.section.updated_at);
  assert.equal(db.rows[0].details.annualSalary, 2000000);
  assert.equal(db.rows[0].checklist.form16, false);
});

test("stale and concurrently changed records are not overwritten", async () => {
  const stale = database([row]);
  await assert.rejects(updateTaxSection(stale, "owner", "2025-26", "salary-documents", "details", {}, null), /another tab/);
  assert.deepEqual(stale.rows[0], row);
  const race = database([row], (rows) => { rows[0].updated_at = "2026-10-07T00:00:00.000Z"; });
  await assert.rejects(updateTaxSection(race, "owner", "2025-26", "salary-documents", "details", {}, row.updated_at), /could not be saved/);
  assert.deepEqual(race.rows[0].details, row.details);
});

test("a removed record is not recreated by a stale edit; first saves are owner-scoped", async () => {
  const db = database();
  await assert.rejects(updateTaxSection(db, "owner", "2025-26", "salary-documents", "details", {}, row.updated_at), /another tab/);
  const result = await updateTaxSection(db, "owner", "2025-26", "salary-documents", "details", row.details, null);
  assert.equal(result.section.user_id, "owner");
  assert.equal(result.section.financial_year, "2025-26");
});

test("missing owners and invalid fields or years cannot write a workspace", async () => {
  const db = database();
  for (const args of [["", "2025-26", "salary-documents", "details"], ["owner", "2025-27", "salary-documents", "details"], ["owner", "2025-26", "unknown", "details"], ["owner", "2025-26", "salary-documents", "user_id"]]) {
    await assert.rejects(updateTaxSection(db, ...args, {}, null));
  }
  assert.equal(db.rows.length, 0);
});

test("adding a filing deadline twice updates the same owned reminder from saved details", async () => {
  const events = [{ id: "other-user", user_id: "someone-else", title: "ITR filing — FY 2025-26", category: "compliance", due_date: "2026-07-31" }];
  const filing = { ...defaultDetails("compliance-filing"), filingDueDate: "2026-10-31" };
  const db = { from(table) {
    let filters = [], operation = "read", payload;
    const q = {
      select() { return q; }, eq(key, value) { filters.push([key, value]); return q; },
      order() { return q; }, limit() { return q; },
      insert(value) { operation = "insert"; payload = value; return q; },
      update(value) { operation = "update"; payload = value; return q; },
      async maybeSingle() {
        if (table === "tax_workspace_sections") {
          assert.deepEqual(filters, [["user_id", "owner"], ["financial_year", "2025-26"], ["section", "compliance-filing"]]);
          return { data: { details: structuredClone(filing) } };
        }
        assert.equal(table, "finance_events");
        if (operation === "insert") { events.push({ id: "new-event", ...payload }); return { data: events.at(-1) }; }
        const match = events.find((e) => filters.every(([key, value]) => e[key] === value));
        if (operation === "update") Object.assign(match, payload);
        return { data: match || null };
      },
    };
    return q;
  } };
  await saveFilingReminder(db, "owner", "2025-26");
  filing.filingDueDate = "2026-11-01";
  const result = await saveFilingReminder(db, "owner", "2025-26");
  assert.equal(events.length, 2);
  assert.equal(result.event.id, "new-event");
  assert.equal(result.event.due_date, "2026-11-01");
  assert.equal(events[0].due_date, "2026-07-31");
  filing.filingDueDate = "";
  await assert.rejects(saveFilingReminder(db, "owner", "2025-26"), /Save a filing deadline/);
  assert.equal(events.length, 2);
});
