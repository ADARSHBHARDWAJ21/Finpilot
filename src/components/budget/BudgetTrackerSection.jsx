"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Calendar,
  Wallet,
  Receipt,
  PiggyBank,
  TrendingUp,
  MoreHorizontal,
  Lightbulb,
  Plus,
  FolderOpen,
  BarChart3,
  Download,
  ChevronRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
} from "recharts";
import { saveBudgetPlan } from "@/app/budget-tracker/actions";
import { buildReportCsv } from "@/lib/budget/compute-from-transactions";
import {
  AddBudgetModal,
  ManageCategoriesModal,
  BudgetPlannerModal,
} from "@/components/budget/BudgetModals";
import CategoryIcon from "@/components/budget/CategoryIcon";
import ClientOnly from "@/components/budget/ClientOnly";

const tabs = ["Overview", "Budget vs Actual", "Categories", "Goals", "Insights"];

const quickActions = [
  { id: "add", label: "Add Budget", icon: Plus },
  { id: "categories", label: "Manage Categories", icon: FolderOpen },
  { id: "planner", label: "Budget Planner", icon: BarChart3 },
  { id: "download", label: "Download Report", icon: Download },
];

function formatInr(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function BudgetHealthRing({ score }) {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width="100" height="100" className="-rotate-90">
      <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="#6366f1"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function CategoryTable({ categories, onEditCategory }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h2 className="text-sm font-semibold text-gray-900">Budget by Category</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-50 bg-gray-50/50">
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-3 py-3 font-medium">Budget</th>
              <th className="px-3 py-3 font-medium">Spent</th>
              <th className="px-3 py-3 font-medium">Remaining</th>
              <th className="px-3 py-3 font-medium min-w-[140px]">Progress</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-5 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500">
                  No spending this month. Add transactions via Add Expense.
                </td>
              </tr>
            ) : (
              categories.map((cat) => {
                return (
                  <tr
                    key={cat.key}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg ${cat.iconBg} flex items-center justify-center shrink-0`}
                        >
                          <CategoryIcon iconKey={cat.iconKey} size={14} className={cat.iconColor} />
                        </div>
                        <span className="font-medium text-gray-900">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">{formatInr(cat.budget)}</td>
                    <td className="px-3 py-3.5">{formatInr(cat.spent)}</td>
                    <td className="px-3 py-3.5">{formatInr(cat.remaining)}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[80px]">
                          <div
                            className={`h-full rounded-full ${cat.barColor}`}
                            style={{ width: `${Math.min(cat.pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 w-8">{cat.pct}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-1 rounded-md ${cat.statusStyle}`}
                      >
                        {cat.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => onEditCategory(cat)}
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                        title="Edit budget"
                      >
                        <MoreHorizontal size={16} className="text-gray-400" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BudgetTrackerSection({
  initialData,
  loadError,
  budgetPlansAvailable: plansAvailableProp = true,
}) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(initialData?.dashboard ?? null);
  const [categoryBudgets, setCategoryBudgets] = useState(
    initialData?.plan?.category_budgets ?? {}
  );
  const [activeTab, setActiveTab] = useState("Overview");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const d = dashboard;
  const budgetPlansAvailable = plansAvailableProp;

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const summaryCards = useMemo(() => {
    if (!d) return [];
    const incomePct =
      d.monthIncome > 0 ? Math.round((d.savings / d.monthIncome) * 1000) / 10 : 0;
    return [
      {
        label: "Total Monthly Budget",
        value: formatInr(d.totalBudget),
        sub: d.monthLabel,
        icon: Wallet,
        iconBg: "bg-indigo-50",
        iconColor: "text-indigo-600",
      },
      {
        label: "Total Spent",
        value: formatInr(d.totalSpent),
        sub: `${d.spentPct}% of budget`,
        icon: Receipt,
        iconBg: "bg-purple-50",
        iconColor: "text-purple-600",
      },
      {
        label: "Remaining Budget",
        value: formatInr(d.remaining),
        sub: `${Math.max(0, 100 - d.spentPct).toFixed(1)}% left`,
        icon: PiggyBank,
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
      },
      {
        label: "Savings This Month",
        value: formatInr(d.savings),
        sub: d.monthIncome > 0 ? `${incomePct}% of income` : "No income recorded",
        icon: TrendingUp,
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
      },
      {
        label: "Avg. Monthly Savings",
        value: formatInr(d.avgMonthlySavings),
        sub: d.hasTransactions ? "From your history" : "Add transactions",
        icon: TrendingUp,
        iconBg: "bg-amber-50",
        iconColor: "text-amber-600",
      },
    ];
  }, [d]);

  async function persistPlan(updates) {
    setSaving(true);
    setToast(null);
    try {
      const result = await saveBudgetPlan({
        monthKey: d.monthKey,
        totalBudget: updates.totalBudget ?? d.totalBudget,
        categoryBudgets: updates.categoryBudgets ?? categoryBudgets,
        savingsGoal: updates.savingsGoal ?? d.savingsGoal,
      });
      setDashboard(result.dashboard);
      setCategoryBudgets(result.plan?.category_budgets ?? updates.categoryBudgets ?? {});
      setModal(null);
      setToast("Budget saved.");
    } catch (error) {
      setToast(error.message || "Failed to save. Run budget_plans migration in Supabase.");
    } finally {
      setSaving(false);
    }
  }

  function handleQuickAction(id) {
    if (id === "download") {
      if (!d) return;
      const csv = buildReportCsv(d);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `budget-report-${d.monthKey}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setToast("Report downloaded.");
      return;
    }
    setModal(id);
  }

  function handleMonthChange(monthKey) {
    router.push(`/budget-tracker?month=${monthKey}`);
  }

  if (loadError && !d) {
    return (
      <div className="p-6 text-sm text-red-600">
        Could not load budget data: {loadError}
      </div>
    );
  }

  if (!d) {
    return <div className="p-6 text-sm text-gray-500">Loading budget data…</div>;
  }

  const sidebar = (
    <aside className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 text-left">Budget Health Score</h3>
        <div className="relative inline-block">
          <BudgetHealthRing score={d.healthScore} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{d.healthScore}</span>
            <span className="text-xs text-gray-400">/100</span>
          </div>
        </div>
        <p className={`text-sm font-semibold mt-3 ${d.health.className}`}>{d.health.text}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Overspent Categories</h3>
        {d.overspentCategories.length === 0 ? (
          <p className="text-xs text-gray-500">No categories near limit.</p>
        ) : (
          <ul className="space-y-3">
            {d.overspentCategories.map((item) => (
              <li key={item.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-700 font-medium">{item.name}</span>
                  <span className="text-red-500 font-semibold">{item.pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${Math.min(item.pct, 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => setActiveTab("Insights")}
          className="mt-4 w-full py-2 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50"
        >
          View All Insights
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <ul className="space-y-0.5">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.id}>
                <button
                  type="button"
                  onClick={() => handleQuickAction(action.id)}
                  className="w-full flex items-center gap-2.5 py-2.5 px-1 rounded-lg hover:bg-gray-50 text-left group"
                >
                  <Icon size={16} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700 flex-1">{action.label}</span>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-amber-50/80 rounded-xl border border-amber-100 p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Lightbulb size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 mb-1">Budget Tip</p>
            <p className="text-[11px] text-gray-600 leading-relaxed">{d.tip}</p>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="w-full max-w-[1500px] min-w-0">
      <ClientOnly>
        {!budgetPlansAvailable && (
          <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            Could not reach budget_plans table. Check Supabase RLS policies and that you are logged in.
          </div>
        )}
        {toast && (
          <div className="mb-3 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
            {toast}
          </div>
        )}
      </ClientOnly>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4 min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Budget Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real data from your transactions — {d.monthLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={d.monthKey}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="appearance-none flex items-center gap-2 bg-white border border-gray-200 pl-3 pr-8 py-2 rounded-xl text-sm text-gray-700"
            >
              {d.availableMonths.map((mk) => (
                <option key={mk} value={mk}>
                  {mk}
                </option>
              ))}
            </select>
            <Calendar
              size={16}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 mb-6 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === tab
                ? "text-indigo-600 border-indigo-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{card.sub}</p>
                </div>
                <div
                  className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}
                >
                  <Icon size={16} className={card.iconColor} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-5 min-w-0">
          {activeTab === "Overview" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Budget Overview</h2>
                  <div className="flex flex-col items-center">
                    <div className="relative w-[200px] h-[200px] min-h-[200px]">
                      <ClientOnly fallback={<div className="w-full h-full" />}>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={d.donutData}
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={90}
                              dataKey="value"
                              paddingAngle={2}
                            >
                              {d.donutData.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </ClientOnly>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-2xl font-bold text-gray-900">{d.spentPct}%</p>
                        <p className="text-xs text-gray-500">Spent</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mt-3">
                      Total Budget: {formatInr(d.totalBudget)}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Spending Trend</h2>
                  <div className="h-[220px] min-h-[220px]">
                    <ClientOnly fallback={<div className="h-[220px]" />}>
                      <ResponsiveContainer width="100%" height={220}>
                        <ComposedChart data={d.spendingTrend}>
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 9, fill: "#9ca3af" }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            angle={-35}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis hide />
                          <Tooltip
                            formatter={(v) => formatInr(v)}
                            contentStyle={{
                              borderRadius: 10,
                              border: "1px solid #e5e7eb",
                              fontSize: 11,
                            }}
                          />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="actual" name="Actual" fill="#6366f1" radius={[3, 3, 0, 0]} />
                          <Line
                            type="monotone"
                            dataKey="budget"
                            name="Budget"
                            stroke="#94a3b8"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </ClientOnly>
                  </div>
                </div>
              </div>
              <CategoryTable
                categories={d.categories}
                onEditCategory={() => setModal("categories")}
              />
            </>
          )}

          {activeTab === "Budget vs Actual" && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Budget vs Actual</h2>
              <div className="h-[280px] min-h-[280px]">
                <ClientOnly fallback={<div className="h-[280px]" />}>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={d.categories.slice(0, 8)}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis tickFormatter={(v) => `₹${v / 1000}k`} />
                      <Tooltip formatter={(v) => formatInr(v)} />
                      <Legend />
                      <Bar dataKey="budget" name="Budget" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="spent" name="Actual" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ClientOnly>
              </div>
            </div>
          )}

          {activeTab === "Categories" && (
            <CategoryTable
              categories={d.categories}
              onEditCategory={() => setModal("categories")}
            />
          )}

          {activeTab === "Goals" && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Savings goal</h2>
              <p className="text-3xl font-bold text-gray-900">{formatInr(d.savingsGoal || d.savings)}</p>
              <p className="text-sm text-gray-500 mt-2">
                Saved this month: {formatInr(d.savings)} of income {formatInr(d.monthIncome)}
              </p>
              <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${d.savingsGoal > 0 ? Math.min(100, (d.savings / d.savingsGoal) * 100) : d.savings > 0 ? 100 : 0}%`,
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setModal("planner")}
                className="mt-4 text-sm text-indigo-600 font-medium"
              >
                Edit goal in Budget Planner →
              </button>
            </div>
          )}

          {activeTab === "Insights" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Insights</h2>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Health score: {d.healthScore}/100 — {d.health.text}</li>
                  <li>• You used {d.spentPct}% of your monthly budget.</li>
                  <li>• {d.tip}</li>
                  {d.overspentCategories.map((c) => (
                    <li key={c.name} className="text-red-600">
                      • {c.name} at {c.pct}% of budget
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {sidebar}
      </div>

      <AddBudgetModal
        open={modal === "add"}
        onClose={() => setModal(null)}
        totalBudget={d.totalBudget}
        saving={saving}
        onSave={(total) => persistPlan({ totalBudget: total })}
      />
      <ManageCategoriesModal
        open={modal === "categories"}
        onClose={() => setModal(null)}
        categories={d.categories}
        saving={saving}
        onSave={(map) => persistPlan({ categoryBudgets: map })}
      />
      <BudgetPlannerModal
        open={modal === "planner"}
        onClose={() => setModal(null)}
        totalBudget={d.totalBudget}
        spent={d.totalSpent}
        saving={saving}
        onSave={({ totalBudget, categoryBudgets: map, savingsGoal }) =>
          persistPlan({ totalBudget, categoryBudgets: map, savingsGoal })
        }
      />
    </div>
  );
}
