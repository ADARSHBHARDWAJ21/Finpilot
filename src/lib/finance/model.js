import { z } from "zod";

export const SECTIONS = [
  "salary-documents",
  "tax-saving-proofs",
  "rent-hra",
  "banking-investments",
  "compliance-filing",
];
export const EVENT_CATEGORIES = [
  "tax",
  "investments",
  "compliance",
  "document",
  "bills",
  "other",
];
export const CHECKLIST_IDS = {
  "salary-documents": [
    "form16",
    "salary_slips",
    "offer_letter",
    "salary_profile",
  ],
  "tax-saving-proofs": ["80c", "80d", "nps", "deductions_db"],
  "rent-hra": ["rent_receipts", "lease", "hra_declared", "paying_rent"],
  "banking-investments": [
    "fd_interest",
    "capital_gains",
    "demat",
    "sip",
    "bank_statement",
  ],
  "compliance-filing": ["ais", "regime", "tax_paid", "itr"],
};
export function indiaToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function validDate(value) {
  if (typeof value !== "string" || !/^20\d{2}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export const dateSchema = z
  .string()
  .refine(validDate, "Enter a valid date between 2000 and 2099.");
export const yearSchema = z
  .string()
  .regex(/^20\d{2}-\d{2}$/)
  .refine(
    (value) => Number(value.slice(5)) === (Number(value.slice(0, 4)) + 1) % 100,
    "Choose a valid financial year.",
  );
export function currentFinancialYear(now = new Date()) {
  const today = indiaToday(now);
  const year =
    Number(today.slice(0, 4)) - (Number(today.slice(5, 7)) < 4 ? 1 : 0);
  return `${year}-${String((year + 1) % 100).padStart(2, "0")}`;
}
export function resolveFinancialYear(value, fallback = currentFinancialYear()) {
  return yearSchema.safeParse(value).success
    ? value
    : yearSchema.safeParse(fallback).success
      ? fallback
      : currentFinancialYear();
}
export function yearDates(year) {
  yearSchema.parse(year);
  const start = Number(year.slice(0, 4));
  return { start: `${start}-04-01`, end: `${start + 1}-03-31` };
}
export function financialYearOptions(selected = currentFinancialYear()) {
  const start = Number(currentFinancialYear().slice(0, 4));
  return [
    ...new Set([
      selected,
      ...Array.from(
        { length: 10 },
        (_, i) =>
          `${start - i}-${String((start - i + 1) % 100).padStart(2, "0")}`,
      ),
    ]),
  ]
    .sort()
    .reverse();
}
export function dayDifference(date, today = indiaToday()) {
  return Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
      86400000,
  );
}
export function shiftDay(date, days) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function displayDate(date) {
  return validDate(date)
    ? new Date(`${date}T12:00:00Z`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Not set";
}

export const eventSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(1, "Enter a reminder title.").max(160),
    description: z.string().trim().max(2000).default(""),
    due_date: dateSchema,
    category: z.enum(EVENT_CATEGORIES).default("other"),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
  })
  .strict();

const money = z.coerce.number().finite().min(0).max(100000000);
const optionalMoney = z.preprocess(
  (value) => (value === "" || value == null ? null : value),
  money.nullable(),
);
export const detailSchemas = {
  "salary-documents": z.object({
    annualSalary: money,
    annualBasic: money,
    annualDa: money,
    annualHra: money,
    employerNps: money,
    governmentEmployer: z.boolean(),
    age: z.preprocess((v) => v === "" || v == null ? null : v, z.coerce.number().int().min(0).max(120).nullable()),
    resident: z.boolean(),
  }).strict().refine((v) => v.annualBasic + v.annualDa + v.annualHra <= v.annualSalary, "Basic salary, DA and HRA cannot exceed gross salary. Include all taxable salary components in gross salary."),
  "tax-saving-proofs": z.object({
    section80c: money,
    healthInsurance: money,
    selfFamilySenior: z.boolean(),
    parentsHealthInsurance: money,
    parentsSenior: z.boolean(),
    personalNps: money,
    confirmedHomeLoanInterest: money,
    educationLoanInterest: money,
    eligibilityConfirmed: z.literal(true, { error: "Confirm that the annual amounts are eligible and supported by your records." }),
  }).strict(),
  "rent-hra": z
    .object({
      payingRent: z.boolean(),
      basicMonthly: money,
      daMonthly: money,
      commissionMonthly: money,
      hraMonthly: money,
      rentMonthly: money,
      months: z.coerce.number().int().min(1).max(12),
      city: z.enum([
        "Delhi",
        "Mumbai",
        "Kolkata",
        "Chennai",
        "Bengaluru",
        "Hyderabad",
        "Pune",
        "Ahmedabad",
        "Other",
      ]),
    })
    .strict(),
  "banking-investments": z
    .object({
      monthlySip: money,
      monthlyEmi: money,
      monthlySideIncome: money,
      annualInterest: money,
      capitalGains: z.coerce.number().finite().min(-100000000).max(100000000),
      notes: z.string().max(2000),
    })
    .strict(),
  "compliance-filing": z
    .object({
      regime: z.enum(["undecided", "old", "new"]),
      status: z.enum(["not-started", "draft", "filed"]),
      filedDate: z.union([dateSchema, z.literal("")]),
      acknowledgement: z.string().trim().max(40),
      annualSalary: optionalMoney,
      annualTds: optionalMoney,
      advanceTax: optionalMoney,
      filingDueDate: z.union([dateSchema, z.literal("")]),
      notes: z.string().max(2000),
    })
    .strict()
    .refine(
      (value) =>
        value.status !== "filed" ||
        (validDate(value.filedDate) && value.filedDate <= indiaToday()),
      "A filed return needs a filing date that is not in the future.",
    ),
};

export function defaultDetails(
  section,
  profile = {},
  salary = null,
  year = profile.financial_year,
) {
  const current = year === profile.financial_year;
  const p = current ? profile : {};
  const s = current ? salary || profile : {};
  const number = (value) => Math.max(0, Number(value) || 0);
  if (section === "salary-documents") return {
    annualSalary: number(s.annual_ctc), annualBasic: number(s.basic_salary) * 12,
    annualDa: 0, annualHra: number(s.hra) * 12, employerNps: number(p.employer_nps) * 12,
    governmentEmployer: false, age: p.age ?? null, resident: true,
  };
  if (section === "tax-saving-proofs") return {
    section80c: ["elss_investments", "ppf", "epf", "tax_saver_fd", "life_insurance"].reduce((sum, key) => sum + number(p[key]), 0),
    healthInsurance: number(p.health_insurance), selfFamilySenior: false,
    parentsHealthInsurance: number(p.parents_health_insurance), parentsSenior: false,
    personalNps: number(p.nps_contribution), confirmedHomeLoanInterest: 0,
    educationLoanInterest: 0, eligibilityConfirmed: false,
  };
  if (section === "rent-hra")
    return {
      payingRent: !!p.paying_rent,
      basicMonthly: number(s.basic_salary),
      daMonthly: 0,
      commissionMonthly: 0,
      hraMonthly: number(s.hra),
      rentMonthly: number(p.monthly_rent),
      months: 12,
      city:
        [
          "Delhi",
          "Mumbai",
          "Kolkata",
          "Chennai",
          "Bengaluru",
          "Hyderabad",
          "Pune",
          "Ahmedabad",
        ].find((city) => city.toLowerCase() === String(p.city).toLowerCase()) ||
        "Other",
    };
  if (section === "banking-investments")
    return {
      monthlySip: number(p.sip_amount),
      monthlyEmi: number(p.emi_obligations),
      monthlySideIncome: number(p.side_income),
      annualInterest: 0,
      capitalGains: 0,
      notes: "",
    };
  if (section === "compliance-filing")
    return {
      regime: "undecided",
      status: "not-started",
      filedDate: "",
      acknowledgement: "",
      annualSalary: null,
      annualTds: null,
      advanceTax: null,
      filingDueDate: "",
      notes: "",
    };
  return {};
}

export function calculateHra(details, year) {
  const parsed = detailSchemas["rent-hra"].safeParse(details);
  if (!parsed.success) return { available: false, exemption: 0 };
  const data = parsed.data;
  const cities = [
    "Delhi",
    "Mumbai",
    "Kolkata",
    "Chennai",
    ...(Number(year.slice(0, 4)) >= 2026
      ? ["Bengaluru", "Hyderabad", "Pune", "Ahmedabad"]
      : []),
  ];
  const rate = cities.includes(data.city) ? 0.5 : 0.4;
  const salary =
    (data.basicMonthly + data.daMonthly + data.commissionMonthly) * data.months;
  const annualHra = data.hraMonthly * data.months;
  const annualRent = data.rentMonthly * data.months;
  const rentLessSalary = Math.max(0, annualRent - salary * 0.1);
  return {
    available: true,
    rate,
    salary,
    annualHra,
    annualRent,
    rentLessSalary,
    salaryLimit: salary * rate,
    exemption: data.payingRent
      ? Math.round(
          Math.max(0, Math.min(annualHra, rentLessSalary, salary * rate)),
        )
      : 0,
  };
}

export function plannerSummary(events, today = indiaToday()) {
  const pending = events.filter((event) => !event.completed);
  return {
    pending: pending.length,
    overdue: pending.filter((event) => event.due_date < today).length,
    week: pending.filter(
      (event) =>
        dayDifference(event.due_date, today) >= 0 &&
        dayDifference(event.due_date, today) <= 7,
    ).length,
    completed: events.filter((event) => event.completed).length,
  };
}

const escapeIcs = (value) =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
export function calendarExport(events, now = new Date()) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Finpilot//Personal finance planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const event of events.filter((event) => validDate(event.due_date))) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeIcs(event.id)}@finpilot.local`,
      `DTSTAMP:${now
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "")}`,
      `DTSTART;VALUE=DATE:${event.due_date.replaceAll("-", "")}`,
      `DTEND;VALUE=DATE:${shiftDay(event.due_date, 1).replaceAll("-", "")}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `DESCRIPTION:${escapeIcs(event.description || "")}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  // RFC 5545 limits lines to 75 octets, preserving Unicode code points.
  return (
    lines
      .map((line) => {
        const parts = [];
        let part = "";
        let size = 0;
        for (const char of line) {
          const bytes = new TextEncoder().encode(char).length;
          if (size + bytes > 74) {
            parts.push(part);
            part = " ";
            size = 1;
          }
          part += char;
          size += bytes;
        }
        parts.push(part);
        return parts.join("\r\n");
      })
      .join("\r\n") + "\r\n"
  );
}

export function csvExport(rows) {
  const cell = (value) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text) && !/^-?\d+(?:\.\d+)?$/.test(text))
      text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
