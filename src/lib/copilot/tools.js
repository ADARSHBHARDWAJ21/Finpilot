import { simulateTaxChange, number } from "./tax-engine.js";
import { taxChangeSchema, emiSchema } from "./validation.js";

const amount = (description) => ({ type: "number", description });
export const COPILOT_TOOLS = [{
  name: "compare_tax",
  description: "Calculate both regimes from the user's saved profile, or simulate a promotion, rent or deduction change. Always call before quoting tax/refund/scenario amounts. Ask for an unspecified raise amount first. Do not guess eligibility, changed salary components, or future-year law. Values are INR. Changes are hypothetical and never saved to the financial profile.",
  parameters: { type: "object", properties: {
    financialYear: { type: "string", enum: ["2024-25", "2025-26", "2026-27"], description: "April–March financial/tax year explicitly requested by the user. Defaults to the saved profile year. An assessment year refers to the following year; clarify ambiguous dates." },
    baselineAnnualSalary: amount("Confirmed CURRENT annual gross salary before exemptions/deductions, including taxable employer NPS, not monthly take-home or CTC. Supply when the user's current gross salary differs from or clarifies recorded CTC; applies to the baseline and salary-change calculation."),
    annualSalary: amount("Confirmed revised annual gross salary before exemptions/deductions, including taxable employer NPS, not monthly take-home or CTC. Mutually exclusive with increasePercent. Partial-year changes also need confirmed baselineAnnualSalary to fully resolve recorded CTC ambiguity."),
    increasePercent: amount("Salary raise percentage explicitly supplied by the user."),
    monthsRemaining: { type: "integer", description: "Months the salary change applies in the selected April–March tax year, from 1 to 12. Default 12 must be stated as an assumption." },
    monthlyRent: amount("Full-year scenario monthly rent, explicitly supplied by the user."),
    section80c: amount("Total annual eligible 80C/80CCC contributions/expenses after the change, excluding personal NPS supplied separately, not the additional amount. Explicit confirmation resolves conflicting saved 80C totals."),
    personalNps: amount("Total annual eligible personal NPS after the change, not an additional contribution. Do not also include this amount in section80c. Calculator allocates up to 50000 to 80CCD(1B) and any eligible remainder within the shared 80C pool. Explicit confirmation resolves conflicting saved NPS totals."),
    employerNps: amount("Total annual employer NPS, excluding personal NPS."),
    governmentEmployer: { type: "boolean", description: "True only when the user confirms Central or State Government employment for this salary. False for private, PSU or other employers. Old-regime NPS cap is 14% for confirmed government employers, otherwise 10%; new regime uses 14%." },
    healthInsurance: amount("Total annual qualifying self/family health-insurance premium."),
    parentsHealthInsurance: amount("Total annual qualifying parents' premium."),
    parentsSenior: { type: "boolean", description: "True only when the user confirms a parent qualifying as a senior citizen for the selected tax year." },
    educationLoanInterest: amount("Annual eligible education-loan interest; use only after confirming lender, purpose and eligible claim period."),
    confirmedHomeLoanInterest: amount("Annual qualifying self-occupied home-loan interest; use only after confirming ownership, occupancy and qualifying loan/completion conditions."),
  } },
}, {
  name: "calculate_emi",
  description: "Calculate a loan EMI and compare it to DECLARED cashflow. Ask for principal, interest rate and tenure when missing. Do not guarantee affordability without all obligations and emergency savings.",
  parameters: { type: "object", properties: { principal: amount("Loan principal in INR."), annualRatePercent: amount("Annual interest rate percentage."), tenureMonths: { type: "integer", description: "Loan tenure in months." } }, required: ["principal", "annualRatePercent", "tenureMonths"] },
}];

export function executeCopilotTool(name, args, context) {
  if (name === "compare_tax") {
    const parsed = taxChangeSchema.safeParse(args);
    if (!parsed.success) return { error: "Invalid scenario inputs. Ask the user to clarify the amounts and timing." };
    return simulateTaxChange(context.taxInputs, parsed.data);
  }
  if (name === "calculate_emi") {
    const parsed = emiSchema.safeParse(args);
    if (!parsed.success) return { error: "Invalid loan inputs. Confirm principal, rate and tenure." };
    const { principal, annualRatePercent, tenureMonths } = parsed.data;
    const r = annualRatePercent / 1200;
    const factor = (1 + r) ** tenureMonths;
    const payment = r === 0 ? principal / tenureMonths : principal * r * factor / (factor - 1);
    const income = number(context.cashflow.declaredMonthlyTakeHome) + number(context.cashflow.declaredMonthlySideIncome);
    const committed = number(context.cashflow.declaredMonthlyCommitted);
    return { kind: "emi", inputs: parsed.data, monthlyEmi: Math.round(payment), totalInterest: Math.round(payment * tenureMonths - principal), declaredMonthlyIncome: income, declaredMonthlyCommitted: committed, remainingAfterEmi: income ? Math.round(income - committed - payment) : null, assumptions: ["Fixed rate, equal monthly payments; fees and rate changes excluded.", "Cashflow is based on declarations, which may be incomplete or overlap. This is not an affordability approval."] };
  }
  return { error: "Unknown tool. Only compare_tax and calculate_emi are available." };
}
