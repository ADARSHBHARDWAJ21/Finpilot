"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CircleDollarSign,
  CircleGauge,
  CircleAlert,
  PiggyBank,
  Plus,
  Target,
  House,
  Car,
  Bike,
  Smartphone,
  Laptop,
  Plane,
  Shield,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import {
  affordabilityEngine,
  buildCalendarEntries,
  buildWhatIfScenarios,
  formatInr,
  goalHealthScore,
  monthsToDate,
} from "@/lib/goals/engine";
import { saveGoalsWorkspace } from "@/app/goals/actions";

const GOAL_TYPES = [
  { id: "home", label: "Home", icon: House, desc: "Home loan or downpayment planning", group: "loan" },
  { id: "car", label: "Car", icon: Car, desc: "Car purchase via EMI or savings", group: "loan" },
  { id: "bike", label: "Bike", icon: Bike, desc: "Bike loan or full purchase", group: "loan" },
  { id: "phone", label: "Phone", icon: Smartphone, desc: "Phone EMI purchase plan", group: "loan" },
  { id: "laptop", label: "Laptop", icon: Laptop, desc: "Laptop purchase/EMI planning", group: "loan" },
  { id: "travel", label: "Travel", icon: Plane, desc: "Vacation savings goal", group: "savings" },
  { id: "emergency", label: "Emergency Fund", icon: Shield, desc: "Safety fund planner", group: "savings" },
  { id: "retirement", label: "Retirement Corpus", icon: Briefcase, desc: "Long-term corpus target", group: "investment" },
  { id: "custom", label: "Custom Goal", icon: Target, desc: "Any custom financial goal", group: "savings" },
];

function defaultWizard(profile) {
  return {
    typeId: "custom",
    name: "",
    estimatedCost: "",
    targetDate: "",
    purchaseMode: "emi",
    existingSavings: "",
    downpayment: "",
    loanDurationMonths: 36,
    priority: "medium",
    expectedPurchaseYear: new Date().getFullYear(),
    hasLoanApproval: false,
    interestRatePct: 10.5,

    monthlyInHandSalary: Number(profile.monthly_inhand_salary) || "",
    bonusIncome: Number(profile.bonus) || "",
    sideIncome: Number(profile.side_income) || "",
    salaryGrowthExpectation: 8,

    monthlyRent: Number(profile.monthly_rent) || "",
    foodExpenses: Number(profile.monthly_food_spend) || "",
    shoppingSpend: Number(profile.monthly_shopping_spend) || "",
    transportationSpend: Number(profile.monthly_transport_spend) || "",
    sipInvestments: Number(profile.sip_amount) || "",
    creditCardUsage: profile.credit_card_usage || "medium",

    existingEmis: Number(profile.emi_obligations) || "",
    existingLoans: "",
    creditCardDebtEmi: "",
    familyObligations: "",

    emergencyFundAvailable: "",
    currentInvestments: "",
    cashSavings: "",
  };
}

export default function GoalsSection({ initialGoals = [], initialCalendarEntries = [], financialProfile }) {
  const [goals, setGoals] = useState(initialGoals);
  const [calendarEntries, setCalendarEntries] = useState(initialCalendarEntries);
  const [openWizard, setOpenWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizard, setWizard] = useState(() => defaultWizard(financialProfile));
  const [selectedScenarioId, setSelectedScenarioId] = useState("downpayment_up");
  const [saveState, setSaveState] = useState(null);
  const [pending, startTransition] = useTransition();

  const simulation = useMemo(() => affordabilityEngine(wizard), [wizard]);
  const scenarios = useMemo(() => buildWhatIfScenarios(wizard), [wizard]);
  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const summary = useMemo(() => {
    const active = goals.filter((g) => g.status !== "completed");
    const achievable = active.filter((g) => g.affordabilityStatus === "Safe").length;
    const risky = active.filter((g) => g.affordabilityStatus === "Risky").length;
    const monthlyGoalAllocation = active.reduce((sum, g) => sum + (g.monthlyRequiredSaving || 0), 0);
    const upcomingEmi = active.reduce((sum, g) => sum + (g.estimatedEmi || 0), 0);
    return {
      activeGoals: active.length,
      achievable,
      risky,
      monthlyGoalAllocation,
      upcomingEmi,
    };
  }, [goals]);

  function updateWizard(key, value) {
    setWizard((prev) => ({ ...prev, [key]: value }));
  }

  function persistWorkspace(nextGoals, nextEntries) {
    setSaveState({ type: "pending" });
    startTransition(async () => {
      try {
        await saveGoalsWorkspace({ goals: nextGoals, calendarEntries: nextEntries });
        setSaveState({ type: "success" });
      } catch (e) {
        setSaveState({ type: "error", message: e.message || "Failed to save goals workspace" });
      }
    });
  }

  function createGoalFromWizard() {
    const type = GOAL_TYPES.find((t) => t.id === wizard.typeId);
    const targetAmount = Number(wizard.estimatedCost) || 0;
    const currentSaved = Number(wizard.existingSavings) || 0;
    const progress = targetAmount > 0 ? Math.min(100, Math.round((currentSaved / targetAmount) * 100)) : 0;
    const monthlyRequiredSaving =
      simulation.monthsToAfford > 0 && simulation.monthsToAfford < 999
        ? Math.round(Math.max(0, targetAmount - currentSaved) / simulation.monthsToAfford)
        : Math.round(Math.max(0, targetAmount - currentSaved));

    const goal = {
      id: `goal-${Date.now()}`,
      name: wizard.name || type?.label || "Custom Goal",
      type: type?.label || "Custom Goal",
      group: type?.group || "savings",
      targetAmount,
      currentSaved,
      progress,
      targetDate: wizard.targetDate || monthsToDate(simulation.monthsToAfford),
      monthlyRequiredSaving,
      affordabilityStatus: simulation.status,
      estimatedEmi: simulation.estimatedEmi,
      completionDate: simulation.readinessDate,
      riskScore: simulation.riskScore,
      healthScore: 0,
      priority: wizard.priority,
      purchaseMode: wizard.purchaseMode,
      loanDurationMonths: wizard.loanDurationMonths,
      interestRatePct: Number(wizard.interestRatePct) || 0,
      timelineMonths: simulation.monthsToAfford,
      status: "active",
      createdAt: new Date().toISOString(),
      pros: simulation.status === "Safe" ? ["EMI-to-income ratio is within safe band."] : [],
      cons:
        simulation.status === "Risky"
          ? ["Current EMI burden is high vs monthly in-hand salary."]
          : [],
    };
    goal.healthScore = goalHealthScore(goal);

    const entries = buildCalendarEntries(goal, simulation);
    const nextGoals = [goal, ...goals];
    const nextEntries = [...calendarEntries, ...entries];
    setGoals(nextGoals);
    setCalendarEntries(nextEntries);
    persistWorkspace(nextGoals, nextEntries);
    setOpenWizard(false);
    setWizardStep(1);
    setWizard(defaultWizard(financialProfile));
  }

  function deleteGoal(goalId) {
    const nextGoals = goals.filter((g) => g.id !== goalId);
    const nextEntries = calendarEntries.filter((e) => e.goalId !== goalId);
    setGoals(nextGoals);
    setCalendarEntries(nextEntries);
    persistWorkspace(nextGoals, nextEntries);
  }

  const donutData = [
    { name: "Safe", value: goals.filter((g) => g.affordabilityStatus === "Safe").length, color: "#73917a" },
    { name: "Moderate", value: goals.filter((g) => g.affordabilityStatus === "Moderate").length, color: "#c6a66f" },
    { name: "Risky", value: goals.filter((g) => g.affordabilityStatus === "Risky").length, color: "#b76d56" },
  ];

  const aiSuggestions = [
    `Increasing downpayment by ₹50,000 may reduce EMI to ${formatInr(scenarios.find((s) => s.id === "downpayment_up")?.result.estimatedEmi || 0)}.`,
    `Reducing shopping by ₹5,000/month can improve readiness to ${scenarios.find((s) => s.id === "shop_down")?.result.readinessDate || "-"}.`,
    `Current affordability status for this simulation is ${simulation.status}.`,
    `Safe EMI threshold (40% rule): ${formatInr(Math.round(simulation.monthlyIncome * 0.4))}.`,
  ];
  const noGoals = goals.length === 0;

  return (
    <div className="w-full max-w-[1500px] min-w-0 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl tracking-[-.04em] font-semibold text-foreground">Goals</h1>
          <p className="text-sm text-muted-foreground mt-1">A little planning for the things that matter.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpenWizard(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-[#193e35] text-white font-semibold text-sm"
        >
          <Plus size={16} />
          Create Goal
        </button>
      </div>

      {saveState?.type === "error" && <p className="text-sm text-red-600">{saveState.message}</p>}
      {saveState?.type === "success" && <p className="text-sm text-emerald-600">Goals workspace synced.</p>}

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <SummaryCard label="Active Goals" value={summary.activeGoals} subtitle={noGoals ? "No active goals" : "Currently running"} icon={Target} />
        <SummaryCard label="Achievable Goals" value={summary.achievable} subtitle={summary.achievable ? "On track goals" : "Nothing to track"} icon={CircleGauge} />
        <SummaryCard label="Risky Goals" value={summary.risky} subtitle={summary.risky ? "Need attention" : "All clear"} icon={CircleAlert} />
        <SummaryCard label="Monthly Goal Allocation" value={formatInr(summary.monthlyGoalAllocation)} subtitle={simulation.monthlyIncome ? `${Math.round((summary.monthlyGoalAllocation / simulation.monthlyIncome) * 100)}% of income` : "0% of income"} icon={PiggyBank} />
        <SummaryCard label="Upcoming EMI Obligations" value={formatInr(summary.upcomingEmi)} subtitle={summary.upcomingEmi ? "Due this month" : "No upcoming EMIs"} icon={CircleDollarSign} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-4">
          {goals.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => <GoalCard key={goal.id} goal={goal} onDelete={deleteGoal} />)}
            </div>
          ) : (
            <EmptyGoalsState onCreate={() => setOpenWizard(true)} />
          )}

          <PopularGoalsStrip onCreate={() => setOpenWizard(true)} />
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Goal Health Score</h3>
            <div className="h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" innerRadius={42} outerRadius={62}>
                    {donutData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{noGoals ? "Create goals to see your overall financial goal health." : "Safe/Moderate/Risky distribution across active goals."}</p>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">Affordability Meter</h3>
            <p className="text-3xl font-semibold text-primary">{noGoals ? "--" : simulation.status}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Debt-to-income: {noGoals ? "--" : `${(simulation.debtToIncome * 100).toFixed(1)}%`} | Savings Rate: {noGoals ? "--" : `${(simulation.savingsRate * 100).toFixed(1)}%`}
            </p>
            <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${noGoals ? 0 : Math.max(10, 100 - simulation.riskScore)}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">Upcoming EMI Dates</h3>
            <ul className="space-y-2 text-xs text-foreground max-h-[180px] overflow-y-auto">
              {calendarEntries
                .filter((e) => e.type === "emi")
                .slice(0, 6)
                .map((e) => (
                  <li key={`${e.goalId}-${e.title}`} className="flex justify-between gap-2">
                    <span>{e.title}</span>
                    <span className="text-muted-foreground">{e.dueDate}</span>
                  </li>
                ))}
              {!calendarEntries.filter((e) => e.type === "emi").length && <li className="text-muted-foreground">No upcoming EMIs</li>}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">AI Suggestions</h3>
            <ul className="space-y-2">
              {(noGoals
                ? [
                    "Add a goal to get personalized affordability insights.",
                    "Plan your goals and stay on track with smart recommendations.",
                    "Track your progress and achieve your financial dreams.",
                  ]
                : aiSuggestions
              ).map((s) => (
                <li key={s} className="text-xs text-foreground bg-[#edf2eb] border border-[#dbe3da] rounded-lg px-3 py-2">
                  {s}
                </li>
              ))}
            </ul>
            {noGoals && <p className="text-xs text-muted-foreground mt-3">Create your first goal to get started</p>}
          </div>
        </aside>
      </div>

      {openWizard && (
        <GoalWizardModal
          wizard={wizard}
          setWizard={setWizard}
          step={wizardStep}
          setStep={setWizardStep}
          simulation={simulation}
          scenarios={scenarios}
          selectedScenario={selectedScenario}
          selectedScenarioId={selectedScenarioId}
          setSelectedScenarioId={setSelectedScenarioId}
          onClose={() => setOpenWizard(false)}
          onCreate={createGoalFromWizard}
        />
      )}

      {pending && <p className="text-xs text-muted-foreground">Syncing goals…</p>}
    </div>
  );
}

function SummaryCard({ label, value, subtitle, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-[#edf2eb] flex items-center justify-center">
          <Icon size={16} className="text-primary" />
        </div>
      </div>
    </div>
  );
}

function EmptyGoalsState({ onCreate }) {
  return (
    <div className="bg-white rounded-2xl border border-border  min-h-[310px] px-6 py-10 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mx-auto w-36 h-36 rounded-full bg-[#edf2eb] flex items-center justify-center border border-[#dbe3da]">
          <div className="w-24 h-24 rounded-full border-8 border-[#dbe3da] flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary flex items-center justify-center">
              <Target size={18} className="text-primary" />
            </div>
          </div>
        </div>
        <h3 className="mt-6 text-2xl font-semibold text-foreground">You don&apos;t have any goals yet</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Create your first financial goal to explore your budget, timeline, and next steps.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-[#193e35] text-white text-sm font-semibold"
        >
          <Plus size={16} />
          Create Your First Goal
        </button>
      </div>
    </div>
  );
}

function PopularGoalsStrip({ onCreate }) {
  const items = [
    { label: "Home Loan", sub: "Buy your dream home", icon: House, color: "text-primary bg-[#edf2eb]" },
    { label: "Car Loan", sub: "Upgrade your ride", icon: Car, color: "text-emerald-600 bg-emerald-50" },
    { label: "Bike Loan", sub: "Get your dream bike", icon: Bike, color: "text-orange-600 bg-orange-50" },
    { label: "Phone EMI", sub: "Latest smartphone", icon: Smartphone, color: "text-primary bg-[#edf2eb]" },
    { label: "Emergency Fund", sub: "Build your safety net", icon: Shield, color: "text-green-600 bg-green-50" },
    { label: "Custom Goal", sub: "Create your own goal", icon: Plus, color: "text-primary bg-[#edf2eb]" },
  ];
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <h3 className="text-base font-semibold text-foreground">Popular Goals</h3>
      <p className="text-xs text-muted-foreground mt-1 mb-3">Choose a goal category to get started</p>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={onCreate}
              className="border border-border rounded-xl p-3 hover:border-[#dbe3da] hover:bg-[#edf2eb]/30 transition-colors text-left"
            >
              <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center`}>
                <Icon size={16} />
              </div>
              <p className="text-sm font-semibold text-foreground mt-3">{item.label}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{item.sub}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GoalCard({ goal, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-foreground">{goal.name}</h3>
          <p className="text-xs text-muted-foreground">{goal.type}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              goal.affordabilityStatus === "Safe"
                ? "bg-emerald-50 text-emerald-700"
                : goal.affordabilityStatus === "Moderate"
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {goal.affordabilityStatus}
          </span>
          <button
            type="button"
            onClick={() => onDelete?.(goal.id)}
            className="text-[11px] font-semibold text-red-600 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="mt-3 space-y-1 text-sm">
        <p className="flex justify-between"><span className="text-muted-foreground">Target Amount</span><span className="font-semibold">{formatInr(goal.targetAmount)}</span></p>
        <p className="flex justify-between"><span className="text-muted-foreground">Current Saved</span><span className="font-semibold">{formatInr(goal.currentSaved)}</span></p>
        <p className="flex justify-between"><span className="text-muted-foreground">Monthly Required</span><span className="font-semibold">{formatInr(goal.monthlyRequiredSaving)}</span></p>
        {goal.purchaseMode === "emi" && <p className="flex justify-between"><span className="text-muted-foreground">Estimated EMI</span><span className="font-semibold">{formatInr(goal.estimatedEmi)}</span></p>}
        <p className="flex justify-between"><span className="text-muted-foreground">Completion</span><span className="font-semibold">{goal.completionDate}</span></p>
      </div>
      <div className="mt-3">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${goal.progress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Progress {goal.progress}%</p>
      </div>
    </div>
  );
}

function GoalWizardModal({
  wizard,
  setWizard,
  step,
  setStep,
  simulation,
  scenarios,
  selectedScenario,
  selectedScenarioId,
  setSelectedScenarioId,
  onClose,
  onCreate,
}) {
  function setField(key, value) {
    setWizard((prev) => ({ ...prev, [key]: value }));
  }

  function setNumericField(key, rawValue) {
    if (rawValue === "") {
      setField(key, "");
      return;
    }
    const parsed = Number(rawValue);
    setField(key, Number.isFinite(parsed) ? parsed : "");
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#152e26]/35 backdrop-blur-sm flex items-start justify-center p-4 sm:py-10 overflow-y-auto">
      <div role="dialog" aria-modal="true" aria-label="Create goal" className="w-full max-w-5xl bg-white rounded-[20px] border border-border p-5 sm:p-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Create Goal</h2>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
        </div>
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <span key={n} className={`px-2 py-1 rounded-full ${step === n ? "bg-primary text-white" : "bg-muted text-[#647268]"}`}>
              Step {n}
            </span>
          ))}
        </div>

        {step === 1 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Select Goal Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {GOAL_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setField("typeId", t.id)}
                    className={`text-left border rounded-xl p-3 ${wizard.typeId === t.id ? "border-primary bg-[#edf2eb]" : "border-border hover:bg-muted"}`}
                  >
                    <div className="flex items-center gap-2"><Icon size={16} className="text-primary" /><span className="font-semibold text-sm">{t.label}</span></div>
                    <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["name", "What do you want to buy/achieve?", "text"],
              ["estimatedCost", "Estimated Cost (₹)", "number"],
              ["targetDate", "Target Purchase Date", "date"],
              ["existingSavings", "Existing Savings (₹)", "number"],
              ["downpayment", "Planned Downpayment (₹)", "number"],
              ["loanDurationMonths", "Preferred Loan Duration (months)", "number"],
              ["interestRatePct", "Expected Interest Rate (%)", "number"],
              ["expectedPurchaseYear", "Expected Purchase Year", "number"],
            ].map(([key, label, type]) => (
              <label key={key} className="block">
                <span className="text-xs font-medium text-[#647268]">{label}</span>
                <input
                  type={type}
                  value={wizard[key]}
                  onChange={(e) =>
                    type === "number"
                      ? setNumericField(key, e.target.value)
                      : setField(key, e.target.value)
                  }
                  className="mt-1 w-full border border-border rounded-xl px-3 py-2 text-sm"
                />
              </label>
            ))}
            <label className="block">
              <span className="text-xs font-medium text-[#647268]">One-time purchase or EMI?</span>
              <select value={wizard.purchaseMode} onChange={(e) => setField("purchaseMode", e.target.value)} className="mt-1 w-full border border-border rounded-xl px-3 py-2 text-sm">
                <option value="emi">EMI</option>
                <option value="one_time">One-time</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[#647268]">Priority Level</span>
              <select value={wizard.priority} onChange={(e) => setField("priority", e.target.value)} className="mt-1 w-full border border-border rounded-xl px-3 py-2 text-sm">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={wizard.hasLoanApproval} onChange={(e) => setField("hasLoanApproval", e.target.checked)} />
              Already have loan approval
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              ["monthlyInHandSalary", "Monthly In-Hand Salary"],
              ["bonusIncome", "Bonus Income (annual)"],
              ["sideIncome", "Side Income (monthly)"],
              ["salaryGrowthExpectation", "Salary Growth Expectation (%)"],
              ["monthlyRent", "Monthly Rent"],
              ["foodExpenses", "Food Expenses"],
              ["shoppingSpend", "Shopping Spend"],
              ["transportationSpend", "Transportation Spend"],
              ["sipInvestments", "SIP Investments"],
              ["existingEmis", "Existing EMIs"],
              ["existingLoans", "Existing Loans"],
              ["creditCardDebtEmi", "Credit Card Debt (monthly)"],
              ["familyObligations", "Family Obligations"],
              ["emergencyFundAvailable", "Emergency Fund Available"],
              ["currentInvestments", "Current Investments"],
              ["cashSavings", "Cash Savings"],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-xs font-medium text-[#647268]">{label}</span>
                <input
                  type="number"
                  value={wizard[key]}
                  onChange={(e) => setNumericField(key, e.target.value)}
                  className="mt-1 w-full border border-border rounded-xl px-3 py-2 text-sm"
                />
              </label>
            ))}
          </div>
        )}

        {step === 4 && (
          <AffordabilityStep simulation={simulation} />
        )}

        {step === 5 && (
          <ResultsStep simulation={simulation} />
        )}

        {step === 6 && (
          <div className="space-y-3 text-sm">
            <p className="font-semibold text-foreground">Your goal calendar</p>
            <p className="text-[#647268]">We will auto-create recurring EMI reminders, milestones, downpayment deadlines, and quarterly reviews on goal creation.</p>
            <p className="text-[#647268]">For this configuration, estimated recurring EMI entries: <span className="font-semibold">{wizard.purchaseMode === "emi" ? wizard.loanDurationMonths : 0}</span>.</p>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">What-if Simulations</h3>
            <div className="space-y-2">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedScenarioId(s.id)}
                  className={`w-full text-left border rounded-xl p-3 ${selectedScenarioId === s.id ? "border-primary bg-[#edf2eb]" : "border-border hover:bg-muted"}`}
                >
                  <p className="text-sm font-semibold text-foreground">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    EMI: {formatInr(s.result.estimatedEmi)} | Status: {s.result.status} | Readiness: {s.result.readinessDate}
                  </p>
                </button>
              ))}
            </div>
            {selectedScenario && (
              <div className="text-xs text-foreground bg-muted border border-border rounded-lg p-3">
                Selected scenario outcome: risk {selectedScenario.result.riskScore}/100, monthly surplus {formatInr(selectedScenario.result.monthlySurplus)}.
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <button type="button" disabled={step <= 1} onClick={() => setStep((s) => Math.max(1, s - 1))} className="px-3 py-2 rounded-xl border border-border text-sm disabled:opacity-40">
            Previous
          </button>
          {step < 7 ? (
            <button type="button" onClick={() => setStep((s) => Math.min(7, s + 1))} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold">
              Next
            </button>
          ) : (
            <button type="button" onClick={onCreate} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold">
              Create Goal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AffordabilityStep({ simulation }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Metric title="Affordability Status" value={simulation.status} />
      <Metric title="Safe EMI" value={formatInr(Math.round(simulation.monthlyIncome * 0.4))} />
      <Metric title="Estimated EMI" value={formatInr(simulation.estimatedEmi)} />
      <Metric title="Debt-to-Income" value={`${(simulation.debtToIncome * 100).toFixed(1)}%`} />
      <Metric title="Savings Rate" value={`${(simulation.savingsRate * 100).toFixed(1)}%`} />
      <Metric title="Emergency Coverage" value={`${simulation.emergencyMonthsAfterDownpayment.toFixed(1)} months`} />
    </div>
  );
}

function ResultsStep({ simulation }) {
  const pros = [];
  const cons = [];
  if (simulation.status === "Safe") pros.push("EMI burden stays in the healthy range.");
  if (simulation.savingsRate >= 0.2) pros.push("Savings rate remains above the 20% recommendation.");
  if (simulation.emergencyMonthsAfterDownpayment >= 6) pros.push("Emergency fund remains above 6 months.");
  if (simulation.status !== "Safe") cons.push("Current EMI burden may pressure monthly cash flow.");
  if (simulation.savingsRate < 0.2) cons.push("Savings rate may fall below the recommended 20%.");
  if (simulation.emergencyMonthsAfterDownpayment < 6) cons.push("Emergency buffer after downpayment is below 6 months.");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Metric title="Timeline Projection" value={`Ready by ${simulation.readinessDate}`} />
        <Metric title="Monthly Cash Flow Impact" value={formatInr(simulation.monthlySurplus)} />
        <Metric title="Estimated EMI" value={formatInr(simulation.estimatedEmi)} />
        <Metric title="Total Interest" value={formatInr(simulation.totalInterest)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
          <p className="text-sm font-semibold text-emerald-700 mb-2">Pros</p>
          <ul className="space-y-1">{(pros.length ? pros : ["No major positive signals yet."]).map((p) => <li key={p} className="text-xs text-emerald-700">{p}</li>)}</ul>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
          <p className="text-sm font-semibold text-orange-700 mb-2">Cons</p>
          <ul className="space-y-1">{(cons.length ? cons : ["No major downside detected."]).map((c) => <li key={c} className="text-xs text-orange-700">{c}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="bg-white border border-border rounded-xl p-3">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-lg font-semibold text-foreground mt-1">{value}</p>
    </div>
  );
}
