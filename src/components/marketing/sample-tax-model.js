import { estimateTax } from "../../lib/copilot/tax-engine.js";

export const SAMPLE_TAX_YEARS = ["2026-27", "2025-26", "2024-25"];
export const SAMPLE_TAX_PROOFS = [
  { id: "salary", label: "Salary & Form 16", file: "sample-form-16.pdf" },
  { id: "deductions", label: "Tax-saving proofs", file: "sample-investment-summary.pdf" },
  { id: "rent", label: "Rent receipts & agreement", file: "sample-rent-receipts.pdf" },
  { id: "banking", label: "Banking & interest records", file: "sample-interest-summary.pdf" },
];

export function createSampleTaxYears() {
  return Object.fromEntries([
    ["2026-27", { annualSalary: "960000", annualBasic: "480000", annualHra: "192000", monthlyRent: "18000", section80c: "120000", healthInsurance: "20000", personalNps: "30000", annualTds: "40000" }],
    ["2025-26", { annualSalary: "900000", annualBasic: "450000", annualHra: "180000", monthlyRent: "17000", section80c: "120000", healthInsurance: "20000", personalNps: "25000", annualTds: "35000" }],
    ["2024-25", { annualSalary: "840000", annualBasic: "420000", annualHra: "168000", monthlyRent: "15000", section80c: "100000", healthInsurance: "18000", personalNps: "20000", annualTds: "25000" }],
  ].map(([year, values]) => [year, { ...values, regime: "undecided", proofs: { salary: true, deductions: true, rent: false, banking: false } }]));
}

export function buildSampleTaxModel(year, profile) {
  const labels = { annualSalary: "Annual gross salary", annualBasic: "Annual basic salary", annualHra: "Annual HRA received", monthlyRent: "Monthly rent", section80c: "Annual 80C amount", healthInsurance: "Annual health premium", personalNps: "Annual personal NPS", annualTds: "Annual TDS" };
  const errors = Object.fromEntries(Object.entries(labels).flatMap(([key, label]) => {
    const value = Number(profile[key]);
    const minimum = key === "annualSalary" ? 1 : 0;
    return String(profile[key]).trim() === "" || !Number.isFinite(value) || value < minimum || value > 10000000
      ? [[key, `${label}: enter ${minimum === 1 ? "a positive amount" : "an amount from ₹0"} up to ₹1 crore.`]] : [];
  }));
  if (!errors.annualSalary && !errors.annualBasic && !errors.annualHra && Number(profile.annualBasic) + Number(profile.annualHra) > Number(profile.annualSalary)) {
    errors.annualSalary = "Gross salary must cover the basic salary and HRA received.";
  }
  const tax = Object.keys(errors).some(key => key !== "annualTds") ? null : estimateTax({
    financialYear: year, annualSalary: Number(profile.annualSalary), annualBasic: Number(profile.annualBasic), annualHra: Number(profile.annualHra), annualRent: Number(profile.monthlyRent) * 12,
    section80c: Number(profile.section80c), healthInsurance: Number(profile.healthInsurance), personalNps: Number(profile.personalNps),
    age: 35, resident: true, metro: false, governmentEmployer: false, salaryIsCtcProxy: false,
  });
  const available = Boolean(tax?.available);
  const selectedTax = available && !errors.annualTds && ["old", "new"].includes(profile.regime) ? tax[profile.regime].tax : null;
  const reviewed = SAMPLE_TAX_PROOFS.filter(proof => profile.proofs[proof.id]).length;
  return { year, profile, errors, tax, available, reviewed, selectedTax,
    outstanding: selectedTax == null ? null : Math.max(0, selectedTax - Number(profile.annualTds)),
    surplus: selectedTax == null ? null : Math.max(0, Number(profile.annualTds) - selectedTax),
    totalOldDeductions: available ? Object.values(tax.old.deductions).reduce((sum, value) => sum + value, 0) : null,
  };
}
