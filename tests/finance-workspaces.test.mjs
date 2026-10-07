import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import {
  validDate,
  currentFinancialYear,
  yearDates,
  calculateHra,
  defaultDetails,
  detailSchemas,
  eventSchema,
  plannerSummary,
  calendarExport,
  csvExport,
} from "../src/lib/finance/model.js";
import {
  goalEvents,
  readOwnedRows,
  validateProofTarget,
} from "../src/lib/finance/data.js";
import { validateProof, proofHeaders } from "../src/lib/finance/proofs.js";
import {
  buildFinanceReport,
  transactionCsv,
} from "../src/lib/finance/reports.js";
import { reportPdf } from "../src/lib/finance/export.js";

test("Indian financial-year boundary and strict calendar dates", () => {
  assert.equal(
    currentFinancialYear(new Date("2026-03-31T18:29:00Z")),
    "2025-26",
  );
  assert.equal(
    currentFinancialYear(new Date("2026-03-31T18:31:00Z")),
    "2026-27",
  );
  assert.deepEqual(yearDates("2025-26"), {
    start: "2025-04-01",
    end: "2026-03-31",
  });
  assert.equal(validDate("2025-02-29"), false);
  assert.equal(validDate("2024-02-29"), true);
  assert.throws(() => yearDates("2025-28"));
});
test("HRA uses all three limits, actual rental period, floor zero, and year-specific cities", () => {
  const d = {
    payingRent: true,
    basicMonthly: 50000,
    daMonthly: 0,
    commissionMonthly: 0,
    hraMonthly: 30000,
    rentMonthly: 30000,
    months: 12,
    city: "Bengaluru",
  };
  assert.equal(calculateHra(d, "2025-26").exemption, 240000);
  assert.equal(calculateHra(d, "2026-27").exemption, 300000);
  assert.equal(calculateHra({ ...d, months: 6 }, "2026-27").exemption, 150000);
  assert.equal(
    calculateHra({ ...d, hraMonthly: 5000 }, "2026-27").exemption,
    60000,
  );
  assert.equal(
    calculateHra({ ...d, rentMonthly: 1000 }, "2026-27").exemption,
    0,
  );
  assert.equal(
    calculateHra({ ...d, payingRent: false }, "2026-27").exemption,
    0,
  );
  assert.equal(calculateHra({ ...d, months: 13 }, "2026-27").available, false);
});
test("historical defaults never borrow current profile declarations or infer filing", () => {
  const profile = {
    financial_year: "2026-27",
    onboarding_completed: true,
    monthly_tds: 5000,
    basic_salary: 50000,
    sip_amount: 2000,
    paying_rent: true,
  };
  assert.equal(
    defaultDetails("rent-hra", profile, null, "2025-26").basicMonthly,
    0,
  );
  assert.equal(
    defaultDetails("compliance-filing", profile, null, "2026-27").status,
    "not-started",
  );
  assert.equal(
    defaultDetails("compliance-filing", profile, null, "2026-27").annualTds,
    null,
  );
  const data = detailSchemas["compliance-filing"].parse({
    ...defaultDetails("compliance-filing"),
    annualTds: "",
  });
  assert.equal(data.annualTds, null);
  assert.equal(
    detailSchemas["compliance-filing"].safeParse({ ...data, status: "filed" })
      .success,
    false,
  );
  assert.equal(
    eventSchema.safeParse({ title: "Test", due_date: "2026-02-30" }).success,
    false,
  );
  assert.equal(
    eventSchema.safeParse({
      title: "Test",
      due_date: "2026-04-01",
      user_id: "another",
    }).success,
    false,
  );
});
test("overdue and week counts respect full date and completed state", () => {
  const events = [
    { due_date: "2025-10-05", completed: false },
    { due_date: "2026-10-06", completed: false },
    { due_date: "2026-10-13", completed: false },
    { due_date: "2026-11-06", completed: false },
    { due_date: "2026-10-01", completed: true },
  ];
  assert.deepEqual(plannerSummary(events, "2026-10-06"), {
    pending: 4,
    overdue: 1,
    week: 2,
    completed: 1,
  });
});
test("calendar export escapes text, folds UTF8, and ends an all-day event on the next date", () => {
  const result = calendarExport(
    [
      {
        id: "test",
        title: "Rent, tax; and\\notes\n" + "₹".repeat(90),
        description: "One\nTwo",
        due_date: "2026-12-31",
      },
    ],
    new Date("2026-10-06T00:00:00Z"),
  );
  assert.match(result, /DTSTART;VALUE=DATE:20261231/);
  assert.match(result, /DTEND;VALUE=DATE:20270101/);
  assert.match(result, /Rent\\, tax\\; and\\\\notes\\n/);
  assert.ok(
    result.split("\r\n").every((line) => Buffer.byteLength(line) <= 75),
  );
});
test("CSV blocks spreadsheet formulas and correctly quotes quotes and multiline data", () => {
  const csv = csvExport([['=HYPERLINK("bad")', " +1+1", "safe\ntext", -15]]);
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(csv.includes('"\' +1+1"'));
  assert.ok(csv.includes('"safe\ntext"'));
  assert.ok(csv.includes('"-15"'));
});
test("proof validation enforces file signatures, size and allowed year/section/category", () => {
  const data = {
    name: "../proof.pdf",
    bytes: Buffer.from("%PDF-1.7\nfixture"),
    year: "2025-26",
    section: "rent-hra",
    proofKey: "lease",
  };
  assert.equal(validateProof(data).name, "proof.pdf");
  assert.throws(() =>
    validateProof({ ...data, bytes: Buffer.from("<html>fake") }),
  );
  assert.throws(() =>
    validateProof({ ...data, bytes: Buffer.alloc(10485761) }),
  );
  assert.throws(() => validateProofTarget("2025-26", "rent-hra", "ais"));
  assert.throws(() => validateProofTarget("2025-28", "rent-hra", "lease"));
  const headers = proofHeaders({
    name: "receipt (1).pdf",
    mime_type: "application/pdf",
  });
  assert.equal(headers["Cache-Control"], "private, no-store");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
});
test("owned workspace reads paginate without leaking another account or year", async () => {
  const calls = [];
  const supabase = {
    from(table) {
      const filters = { table };
      const query = {
        select() {
          return query;
        },
        eq(k, v) {
          filters[k] = v;
          return query;
        },
        order() {
          return query;
        },
        async range(start, end) {
          calls.push({ ...filters, start, end });
          return {
            data: Array.from({ length: start === 0 ? 1000 : 2 }, (_, i) => ({
              id: start + i,
            })),
            error: null,
          };
        },
      };
      return query;
    },
  };
  const data = await readOwnedRows(
    supabase,
    "tax_documents",
    "owner",
    "2025-26",
  );
  assert.equal(data.length, 1002);
  assert.ok(
    calls.every((c) => c.user_id === "owner" && c.financial_year === "2025-26"),
  );
  assert.equal(calls[1].start, 1000);
  await assert.rejects(() => readOwnedRows(supabase, "tax_documents", null));
});
test("goal dates are stable across calendar months and unparseable dates are omitted", () => {
  const events = goalEvents({
    documents: {
      goals_workspace: {
        calendarEntries: [
          { goalId: "a", dueDate: "Nov 2026" },
          { goalId: "b", dueDate: "2025-10-15" },
          { goalId: "c", dueDate: "someday" },
        ],
      },
    },
  });
  assert.deepEqual(
    events.map((e) => e.due_date),
    ["2026-11-01", "2025-10-15"],
  );
  assert.ok(events.every((e) => e.source === "goals"));
});
const workspace = () => ({ year: "2025-26", sections: {}, documents: [] });
test("reports include exactly the selected financial year, actual monthly totals and no invented refunds", () => {
  const report = buildFinanceReport({
    profile: {
      financial_year: "2026-27",
      annual_ctc: 1800000,
      monthly_tds: 10000,
    },
    workspace: workspace(),
    transactions: [
      { transaction_date: "2025-03-31", amount: 999, type: "income" },
      { transaction_date: "2025-04-01", amount: 100, type: "income" },
      {
        transaction_date: "2026-03-31",
        amount: 40,
        type: "expense",
        category: "Food",
      },
      { transaction_date: "2026-04-01", amount: 500, type: "income" },
    ],
  });
  assert.equal(report.transactions.length, 2);
  assert.equal(report.income, 100);
  assert.equal(report.expenses, 40);
  assert.equal(report.months[0].income, 100);
  assert.equal(report.months[11].expenses, 40);
  assert.equal(report.tax.available, false);
  assert.equal(report.filing.annualTds, null);
  assert.equal(report.filing.status, "not-started");
  assert.equal(report.refund, undefined);
  assert.ok(report.checklist.every((c) => c.completed === 0));
  assert.ok(!transactionCsv(report).includes("999"));
});
test("saved rental-period HRA feeds the report estimate independently of NPS salary basis", () => {
  const w = workspace();
  w.sections["rent-hra"] = {
    details: {
      payingRent: true,
      basicMonthly: 50000,
      daMonthly: 10000,
      commissionMonthly: 0,
      hraMonthly: 25000,
      rentMonthly: 25000,
      months: 6,
      city: "Delhi",
    },
  };
  const report = buildFinanceReport({
    profile: {
      financial_year: "2025-26",
      annual_ctc: 1800000,
      basic_salary: 50000,
      hra: 25000,
      age: 30,
      employer_nps: 4000,
    },
    workspace: w,
  });
  assert.equal(report.tax.old.deductions.hra, 114000);
  assert.equal(report.tax.old.deductions.employerNps, 48000);
});
test("generated PDF is a real readable PDF with at least one page", async () => {
  const report = buildFinanceReport({ workspace: workspace() });
  const bytes = await reportPdf(report);
  assert.ok(Buffer.from(bytes).subarray(0, 5).toString() === "%PDF-");
  const pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() >= 1);
  assert.equal(pdf.getTitle(), "Finpilot financial report 2025-26");
});
