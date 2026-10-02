import { estimateTax, profileTaxInputs, number, inr } from "./tax-engine.js";

function indiaDate(now) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

async function readTransactions(supabase, userId, start, today) {
  const rows = [];
  for (let offset = 0; offset < 10000; offset += 1000) {
    const result = await supabase.from("transactions")
      .select("transaction_date,amount,type,category")
      .eq("user_id", userId).gte("transaction_date", start).lte("transaction_date", today)
      .order("transaction_date", { ascending: false }).order("id", { ascending: false })
      .range(offset, offset + 999);
    if (result.error) return { data: null, error: result.error };
    rows.push(...(result.data || []));
    if ((result.data || []).length < 1000) return { data: rows, truncated: false };
  }
  return { data: rows, truncated: true };
}

export async function loadCopilotContext(supabase, userId, now = new Date()) {
  const today = indiaDate(now);
  const [year, month] = today.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 6, 1)).toISOString().slice(0, 10);
  const [profileResult, salaryResult, deductionResult, budgetResult, txResult] = await Promise.all([
    supabase.from("onboarding_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("salary_profiles").select("annual_ctc,basic_salary,hra,employer_nps,tax_regime,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("deductions").select("key,amount").eq("user_id", userId).limit(1000),
    supabase.from("budget_plans").select("category,monthly_limit,updated_at,month,year").eq("user_id", userId).eq("year", year).in("month", [String(month), String(month).padStart(2, "0")]),
    readTransactions(supabase, userId, start, today),
  ]);
  if (profileResult.error) throw new Error("PROFILE_UNAVAILABLE");
  return buildCopilotContext({ profile: profileResult.data || {}, salary: salaryResult.data, deductions: deductionResult.data, budgets: budgetResult.data, transactions: txResult.data, warnings: [salaryResult.error && "Salary workspace is unavailable; using onboarding declarations.", deductionResult.error && "Deduction workspace is unavailable.", budgetResult.error && "Budget plans are unavailable.", txResult.error && "Transaction history is unavailable.", txResult.truncated && "Spending summary is limited to the latest 10,000 records."].filter(Boolean), today, start });
}

export function buildCopilotContext({ profile = {}, salary = null, deductions = null, budgets = null, transactions = null, warnings = [], today, start }) {
  warnings = [...warnings];
  const taxInputs = profileTaxInputs(profile, salary);
  const deductionRecords = (deductions || []).map((row) => ({ key: String(row.key || "").trim().toUpperCase().slice(0, 40), amount: number(row.amount) }));
  const deductionSources = [
    { key: "80C", profileDeclaredAmount: taxInputs.section80c, profileAmount: Math.min(150000, taxInputs.section80c), confirmationInputs: ["section80c"] },
    { key: "80D", profileDeclaredAmount: taxInputs.healthInsurance + taxInputs.parentsHealthInsurance, profileAmount: taxInputs.healthInsurance + taxInputs.parentsHealthInsurance, profileSelfFamilyAmount: taxInputs.healthInsurance, profileParentsAmount: taxInputs.parentsHealthInsurance, confirmationInputs: ["healthInsurance", "parentsHealthInsurance"] },
    { key: "80CCD_1B", profileDeclaredAmount: taxInputs.personalNps, profileAmount: taxInputs.personalNps, confirmationInputs: ["personalNps"] },
  ].map((source) => {
    const workspaceAmounts = deductionRecords.filter((row) => row.key === source.key).map((row) => row.amount);
    const distinctWorkspaceAmounts = [...new Set(workspaceAmounts)];
    // Synchronization stores capped 80C totals. Never add rows whose provenance is unknown.
    const differs = workspaceAmounts.some((amount) => Math.abs((source.key === "80C" ? Math.min(150000, amount) : amount) - source.profileAmount) > .01);
    const duplicateCount = Math.max(0, workspaceAmounts.length - 1);
    return { ...source, workspaceAmounts, distinctWorkspaceAmounts, duplicateCount, requiresConfirmation: differs || duplicateCount > 0, reason: duplicateCount > 0 ? "Multiple workspace rows may repeat onboarding synchronization or represent separate expenses; their annual total is unconfirmed." : differs ? "The saved workspace amount differs from the onboarding declaration." : null };
  });
  taxInputs.deductionConflicts = deductionSources.filter((source) => source.requiresConfirmation);
  for (const conflict of taxInputs.deductionConflicts) {
    const rowPreview = conflict.workspaceAmounts.slice(0, 5).map(inr).join(", ");
    const rowCount = conflict.workspaceAmounts.length;
    warnings.push(`${conflict.key} needs confirmation: onboarding annual amount ${inr(conflict.profileDeclaredAmount)}; ${rowCount} separate workspace row(s), amount(s) ${rowPreview}${rowCount > 5 ? ", … (first 5 shown)" : ""}. ${conflict.reason} Confirm the eligible annual total${conflict.key === "80D" ? " separately for self/family and parents" : ""}; rows have not been added together.`);
  }
  const tax = estimateTax(taxInputs);
  const monthKey = today.slice(0, 7);
  const monthly = new Map();
  const categoryTotals = new Map();
  for (const tx of transactions || []) {
    const key = String(tx.transaction_date).slice(0, 7);
    const row = monthly.get(key) || { month: key, income: 0, expenses: 0 };
    if (tx.type === "income") row.income += number(tx.amount);
    if (tx.type === "expense") {
      row.expenses += number(tx.amount);
      if (key === monthKey) {
        const category = String(tx.category || "Other").slice(0, 80);
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + number(tx.amount));
      }
    }
    monthly.set(key, row);
  }
  const currentMonth = monthly.get(monthKey) || { month: monthKey, income: 0, expenses: 0 };
  const spending = { available: transactions !== null, periodStart: start, periodEnd: today, currentMonth, months: [...monthly.values()].sort((a, b) => a.month.localeCompare(b.month)), topCategories: [...categoryTotals].map(([category, amount]) => ({ category, amount: Math.round(amount) })).sort((a, b) => b.amount - a.amount).slice(0, 8), note: "Only recorded transactions; totals are not proof of complete bank activity." };
  const byCategory = new Map();
  for (const row of budgets || []) {
    const category = String(row.category).slice(0, 80);
    const previous = byCategory.get(category);
    if (!previous || String(row.updated_at) > String(previous.updated_at)) byCategory.set(category, row);
  }
  const budget = { available: budgets !== null, month: monthKey, categories: [...byCategory].map(([category, row]) => ({ category, limit: number(row.monthly_limit) })) };
  const monthlyCommitted = ["monthly_rent", "monthly_food_spend", "monthly_transport_spend", "monthly_shopping_spend", "emi_obligations", "sip_amount"].reduce((sum, key) => sum + number(profile[key]), 0);
  const cashflow = { declaredMonthlyTakeHome: number(profile.monthly_inhand_salary), declaredMonthlySideIncome: number(profile.side_income), declaredMonthlyCommitted: monthlyCommitted, existingMonthlyEmi: number(profile.emi_obligations), monthlySip: number(profile.sip_amount), monthlySavingsGoal: number(profile.savings_goal), note: "Declared expenses may overlap; affordability estimates need confirmation of all obligations and emergency savings." };
  const savedGoals = profile.documents?.goals_workspace?.goals;
  const goals = (Array.isArray(savedGoals) ? savedGoals : []).slice(0, 15).map((goal) => ({ name: String(goal.name || goal.title || "Financial goal").slice(0, 100), targetAmount: number(goal.targetAmount), currentSaved: number(goal.currentSaved), monthlyRequiredSaving: number(goal.monthlyRequiredSaving), targetDate: String(goal.targetDate || "").slice(0, 20), purchaseMode: String(goal.purchaseMode || "").slice(0, 20) }));
  const context = { asOf: today, financialYear: taxInputs.financialYear, taxInputs, tax, spending, budget, cashflow, goals, deductionRecords, deductionSources, dataWarnings: warnings, documentAvailability: "The current SaaS stores document flags, not document contents. No Form 16, AIS, rent receipt or bank document has been read by this Copilot." };
  const insights = [];
  if (tax.available) insights.push({ text: tax.recommended === "equal" ? "Both regimes have the same salary-only estimate." : `${tax.recommended === "old" ? "Old" : "New"} regime estimates ${inr(tax.difference)} less annual tax. Confirm gross salary and eligibility.`, prompt: "Compare both tax regimes using my saved profile and explain the assumptions." });
  if (spending.available && spending.topCategories[0]) insights.push({ text: `${spending.topCategories[0].category} is your largest recorded expense category this month.`, prompt: "Where is most of my spending going this month, and how could I reduce it?" });
  if (!taxInputs.deductionConflicts.some((conflict) => conflict.key === "80C") && taxInputs.section80c < 150000) insights.push({ text: `${inr(150000 - Math.min(150000, taxInputs.section80c))} of the old-regime deduction limit is unused in your declarations.`, prompt: "Am I missing deductions for expenses I already pay? Check whether they actually reduce my tax before suggesting investments." });
  insights.push({ text: "Model a promotion before changing your payroll declaration.", prompt: "If I get a promotion, what happens to my tax? Ask me for the raise amount and effective date." });
  // Contact details, identifiers, merchant descriptions and employer names never enter model context.
  return { context, view: { name: String(profile.full_name || "there").slice(0, 80), financialYear: taxInputs.financialYear, asOf: today, tax, cashflow, spending, insights, dataWarnings: warnings } };
}
