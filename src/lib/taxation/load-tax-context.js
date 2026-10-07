import { loadFinanceProfile } from "../finance/load.js";
import { loadTaxWorkspace } from "../finance/data.js";
import { resolveFinancialYear } from "../finance/model.js";
import { buildFinanceReport } from "../finance/reports.js";

export async function loadTaxContext(supabase, userId, selectedYear) {
  const base = await loadFinanceProfile(supabase, userId);
  const financialYear = resolveFinancialYear(selectedYear, base.profile.financial_year);
  const workspace = await loadTaxWorkspace(supabase, userId, financialYear);
  const report = buildFinanceReport({ ...base, workspace });
  const tax = report.tax;
  const completed = report.checklist.reduce((sum, c) => sum + c.completed, 0);
  const total = report.checklist.reduce((sum, c) => sum + c.total, 0);
  return {
    userName: base.profile.full_name || "User", financialYear,
    salaryProfile: base.salary, onboardingProfile: base.profile, deductions: base.deductions,
    workspace, report, annualCtc: report.taxInputs.annualSalary,
    taxHealthScore: total ? Math.round(completed / total * 100) : 0,
    recommendedRegime: tax.available ? tax.recommended : null,
    estimatedTax: tax.available ? Math.min(tax.old.tax, tax.new.tax) : null,
    estimatedTaxOld: tax.available ? tax.old.tax : null,
    estimatedTaxNew: tax.available ? tax.new.tax : null,
    hraExemption: report.hra.exemption, payingRent: report.rent.payingRent,
    rentMonthly: report.rent.rentMonthly, hraMonthly: report.rent.hraMonthly,
    taxCalculation: null,
  };
}
