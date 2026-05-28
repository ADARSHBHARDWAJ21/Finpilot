"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  ClipboardList,
  Download,
  HeartPulse,
  MessageCircle,
  PiggyBank,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ClientOnly from "@/components/budget/ClientOnly";
import { buildRegimeCompareData } from "@/lib/taxation/build-regime-compare-data";
import { setPreferredTaxRegime } from "@/app/taxation/actions";

const GREEN = "#10b981";
const GREEN_SOFT = "#d1fae5";
const PURPLE = "#6366f1";
const PURPLE_SOFT = "#e0e7ff";

function formatInr(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
}

function TaxHealthRing({ score }) {
  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width="96" height="96" className="-rotate-90 shrink-0">
      <circle cx="48" cy="48" r="38" fill="none" stroke="#f3f4f6" strokeWidth="10" />
      <circle
        cx="48"
        cy="48"
        r="38"
        fill="none"
        stroke={PURPLE}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function DonutChart({ data, centerLabel, centerValue, tone = "neutral" }) {
  if (!data?.length) {
    return <p className="text-xs text-gray-500 text-center py-10">No data available</p>;
  }

  return (
    <div className="h-[160px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={68} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="#fff" strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatInr(v)} />
        </PieChart>
      </ResponsiveContainer>
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none ${
          tone === "green" ? "text-emerald-800" : tone === "purple" ? "text-indigo-900" : "text-gray-900"
        }`}
      >
        <p className="text-[10px] text-gray-500 font-medium">{centerLabel}</p>
        <p className="text-sm font-bold leading-tight mt-0.5">{centerValue}</p>
      </div>
    </div>
  );
}

function RegimeCard({ detail, isRecommended, regimeLabel, variant }) {
  const isOld = variant === "old";
  const ringClass = isRecommended
    ? isOld
      ? "ring-2 ring-emerald-200 border-emerald-100 shadow-emerald-100/40"
      : "ring-2 ring-indigo-200 border-indigo-100 shadow-indigo-100/40"
    : "border-gray-100";

  const radioOuter = isRecommended
    ? isOld
      ? "border-emerald-500 bg-emerald-500"
      : "border-indigo-500 bg-indigo-500"
    : "border-gray-300 bg-white";

  const donutPalette = isOld
    ? ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"]
    : ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe"];

  const donutData =
    detail.regime === "old"
      ? detail.deductionItems
          .filter((d) => d.key !== "STD")
          .map((d, i) => ({
            name: d.label.replace("Section ", ""),
            value: d.amount,
            color: donutPalette[i % donutPalette.length],
          }))
      : [{ name: "Standard", value: detail.standardDeduction, color: PURPLE }];

  const accentTax = isOld ? "text-emerald-600" : "text-indigo-600";

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 ${ringClass}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 ${radioOuter}`}
            aria-hidden
          >
            {isRecommended && <span className="w-2 h-2 rounded-full bg-white" />}
          </span>
          <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">{regimeLabel}</h3>
        </div>
        {isRecommended && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md ${
              isOld ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"
            }`}
          >
            Recommended
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`rounded-xl p-3 ${isOld ? "bg-emerald-50/60" : "bg-indigo-50/50"}`}>
          <p className="text-[11px] text-gray-500 font-medium">Taxable Income</p>
          <p className="text-sm font-bold text-gray-900 mt-1">{formatInr(detail.taxableIncome)}</p>
        </div>
        <div className="rounded-xl p-3 bg-gray-50">
          <p className="text-[11px] text-gray-500 font-medium">Effective Tax Rate</p>
          <p className="text-sm font-bold text-gray-900 mt-1">{detail.effectiveRate.toFixed(1)}%</p>
        </div>
      </div>

      <p className="text-xs font-semibold text-gray-800 mb-2">
        {detail.regime === "old" ? "Deductions & Exemptions" : "Deductions"}
      </p>
      {detail.regime === "new" && (
        <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
          No other deductions available in new regime.
        </p>
      )}
      {detail.deductionItems.length > 0 ? (
        <ul className="space-y-2 mb-4">
          {detail.deductionItems.map((item) => (
            <li key={item.key} className="flex justify-between items-center text-xs gap-2">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-semibold text-gray-900 tabular-nums">{formatInr(item.amount)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mb-4 rounded-xl bg-gray-50/80 p-2">
        <DonutChart
          data={donutData.length ? donutData : [{ name: "Standard", value: detail.standardDeduction, color: PURPLE }]}
          centerLabel="Total Deductions"
          centerValue={formatInr(detail.totalDeductions)}
          tone={isOld ? "green" : "purple"}
        />
      </div>

      <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
        <div className="flex justify-between items-baseline">
          <span className="text-gray-600 text-xs">Tax Payable</span>
          <span className={`font-bold text-base tabular-nums ${accentTax}`}>{formatInr(detail.baseTax)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Cess & Surcharge</span>
          <span className="font-semibold text-gray-800 tabular-nums">{formatInr(detail.cess)}</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-dashed border-gray-100">
          <span className="text-gray-900 font-semibold text-xs">Total Tax</span>
          <span className="font-bold text-gray-900 tabular-nums">{formatInr(detail.totalTax)}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-gray-500">Monthly TDS</p>
          <p className="font-semibold text-gray-900 mt-0.5 tabular-nums">{formatInr(detail.monthlyTds)}</p>
        </div>
        <div>
          <p className="text-gray-500">Total TDS</p>
          <p className="font-semibold text-gray-900 mt-0.5 tabular-nums">{formatInr(detail.annualTds)}</p>
        </div>
      </div>

      <div className="mt-4">
        {detail.refund > 0 ? (
          <span className="inline-flex w-full justify-center text-xs font-bold px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            Expected Refund: {formatInr(detail.refund)}
          </span>
        ) : detail.additionalTax > 0 ? (
          <span className="inline-flex w-full justify-center text-xs font-bold px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100">
            Expected Additional Tax: {formatInr(detail.additionalTax)}
          </span>
        ) : (
          <span className="inline-flex w-full justify-center text-xs font-semibold px-3 py-2 rounded-lg bg-gray-50 text-gray-600 border border-gray-100">
            TDS aligns with estimated tax
          </span>
        )}
      </div>
    </div>
  );
}

export default function CompareRegimesSection({ initialData, taxContext }) {
  const router = useRouter();
  const [preferred, setPreferred] = useState(initialData.preferredRegime);
  const [pending, startTransition] = useTransition();
  const [copilotQuestion, setCopilotQuestion] = useState("");
  const [sim, setSim] = useState({
    salaryHikePct: 0,
    bonus: 0,
    sideIncome: 0,
    homeLoan: Boolean(taxContext?.onboardingProfile?.planning_home_loan),
    additional80c: 0,
  });

  const data = useMemo(() => {
    const baseCtc = Number(taxContext?.annualCtc) || 0;
    const adjustedCtc =
      Math.round(baseCtc * (1 + sim.salaryHikePct / 100)) + Number(sim.bonus) + Number(sim.sideIncome);

    return buildRegimeCompareData(taxContext, {
      annual_ctc: adjustedCtc,
      home_loan_interest: sim.homeLoan ? 200000 : 0,
      section80c: Math.min(
        150000,
        (initialData.compareInputs?.section80c || 0) + Number(sim.additional80c)
      ),
    });
  }, [taxContext, sim, initialData.compareInputs?.section80c]);

  const isOldRecommended = data.recommended === "old";
  const initials = (data.userName || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const barCompare = [
    { name: "Old Regime", tax: data.old.totalTax, fill: GREEN },
    { name: "New Regime", tax: data.new.totalTax, fill: PURPLE },
  ];

  const savingsIcons = [
    { Icon: PiggyBank, bg: "bg-amber-50", color: "text-amber-600" },
    { Icon: TrendingUp, bg: "bg-indigo-50", color: "text-indigo-600" },
    { Icon: HeartPulse, bg: "bg-rose-50", color: "text-rose-600" },
  ];

  function handleRecalculate() {
    router.refresh();
  }

  function handleDownload() {
    const rows = [
      ["Metric", "Old Regime", "New Regime"],
      ["Taxable Income", data.old.taxableIncome, data.new.taxableIncome],
      ["Total Tax", data.old.totalTax, data.new.totalTax],
      ["Effective Rate", `${data.old.effectiveRate.toFixed(1)}%`, `${data.new.effectiveRate.toFixed(1)}%`],
      ["Recommended", data.recommended, ""],
      ["Savings", data.savings, ""],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax-regime-comparison-FY-${data.financialYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function chooseRegime(regime) {
    startTransition(async () => {
      await setPreferredTaxRegime(regime);
      setPreferred(regime);
    });
  }

  function submitCopilot(e) {
    e.preventDefault();
    const q = copilotQuestion.trim();
    if (!q) return;
    router.push(`/taxation/ai-copilot?q=${encodeURIComponent(q)}`);
  }

  const regimeTitleWord = isOldRecommended ? "Old" : "New";
  const oppWithIcons = data.savingsOpportunities.map((opp, i) => ({
    ...opp,
    ...savingsIcons[i % savingsIcons.length],
  }));

  return (
    <div className="w-full min-w-0 pb-36">
      {/* Header — matches reference */}
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <Link
            href="/taxation"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline mb-2"
          >
            <ArrowLeft size={14} />
            Taxation
          </Link>
          <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">Compare Tax Regimes</h1>
          <p className="text-sm text-gray-500 mt-1.5 max-w-xl">
            Compare Old vs New tax regime to find which one saves you more.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={handleRecalculate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw size={16} className={pending ? "animate-spin text-indigo-600" : ""} />
            Recalculate
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <Download size={16} />
            Download Report
          </button>
          <button
            type="button"
            suppressHydrationWarning
            className="relative w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm"
          >
            <Bell size={18} className="text-gray-500" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>
          <div className="flex items-center gap-3 pl-1 border-l border-gray-200 ml-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 capitalize truncate">{data.userName}</p>
              <p className="text-xs text-gray-400">FY {data.financialYear}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 items-start">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Top summary row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                  <Trophy size={22} className="text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Recommended Regime</p>
                  <p className="text-lg font-bold text-gray-900 capitalize mt-0.5">{data.recommended} Regime</p>
                  <span className="inline-flex mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Saves More
                  </span>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    You save <span className="font-bold text-emerald-700">{formatInr(data.savings)}</span> every year
                    vs {isOldRecommended ? "New" : "Old"} Regime
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Annual Tax Payable Comparison</h3>
              <ClientOnly fallback={<div className="h-[100px] bg-gray-50 rounded-lg animate-pulse" />}>
                <div className="h-[100px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barCompare}
                      layout="vertical"
                      margin={{ left: 4, right: 28, top: 4, bottom: 4 }}
                      barCategoryGap={16}
                    >
                      <XAxis type="number" hide domain={[0, "dataMax"]} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={78}
                        tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip formatter={(v) => formatInr(v)} cursor={{ fill: "transparent" }} />
                      <Bar dataKey="tax" radius={[0, 8, 8, 0]} barSize={26}>
                        {barCompare.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                        <LabelList
                          dataKey="tax"
                          position="right"
                          formatter={(v) => formatInr(v)}
                          style={{ fill: "#374151", fontSize: 11, fontWeight: 700 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ClientOnly>
              <p className="text-[11px] text-emerald-700 font-semibold mt-2 flex items-center gap-1">
                <Check size={12} className="shrink-0" />
                You save {formatInr(data.savings)} ({data.savingsPercent}%) with{" "}
                <span className="capitalize">{data.recommended}</span> Regime
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Tax Over Time (Next 5 Years)</h3>
              <ClientOnly fallback={<div className="h-[110px] bg-gray-50 rounded-lg animate-pulse" />}>
                <div className="h-[110px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.fiveYearProjection}>
                      <XAxis dataKey="fy" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip formatter={(v) => formatInr(v)} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        iconSize={6}
                        wrapperStyle={{ fontSize: 10, paddingBottom: 4 }}
                      />
                      <Line type="monotone" dataKey="oldTax" name="Old" stroke={GREEN} strokeWidth={2.5} dot={false} />
                      <Line
                        type="monotone"
                        dataKey="newTax"
                        name="New"
                        stroke={PURPLE}
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ClientOnly>
            </div>
          </div>

          {/* Regime detail cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RegimeCard
              detail={data.old}
              isRecommended={isOldRecommended}
              regimeLabel="Old Regime"
              variant="old"
            />
            <RegimeCard
              detail={data.new}
              isRecommended={!isOldRecommended}
              regimeLabel="New Regime"
              variant="new"
            />
          </div>

          {/* Why + savings + simulator */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-col lg:flex-row gap-5">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Why {regimeTitleWord} Regime Works Better For You
                </h3>
                <ul className="space-y-2.5">
                  {data.insights.map((text) => (
                    <li key={text} className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="hidden lg:flex w-28 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-b from-gray-50 to-indigo-50/30 border border-gray-100 py-4">
                <ClipboardList className="text-indigo-400 w-12 h-12" strokeWidth={1.25} />
                <span className="text-[10px] text-gray-400 mt-2 text-center px-2">Tax checklist</span>
              </div>
            </div>
          </div>

          {oppWithIcons.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {oppWithIcons.map((opp) => {
                const I = opp.Icon;
                return (
                  <div
                    key={opp.title}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col"
                  >
                    <div className={`w-9 h-9 rounded-lg ${opp.bg} flex items-center justify-center mb-3`}>
                      <I size={18} className={opp.color} />
                    </div>
                    <p className="text-sm font-bold text-gray-900">{opp.title}</p>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed flex-1">{opp.desc}</p>
                    <Link
                      href={opp.href}
                      className="text-xs font-bold text-indigo-600 mt-3 inline-flex items-center gap-0.5 hover:underline"
                    >
                      {opp.cta}
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Regime Switch Simulator</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3.5">
                {[
                  ["salaryHikePct", "Salary Hike (%)", "number"],
                  ["bonus", "Bonus (₹)", "number"],
                  ["sideIncome", "Side Income (₹)", "number"],
                  ["additional80c", "Additional 80C Invest (₹)", "number"],
                ].map(([key, label, type]) => (
                  <label key={key} className="block">
                    <span className="text-[11px] font-semibold text-gray-600">{label}</span>
                    <input
                      type={type}
                      value={sim[key]}
                      onChange={(e) =>
                        setSim((s) => ({ ...s, [key]: key === "homeLoan" ? s.homeLoan : Number(e.target.value) }))
                      }
                      className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                    />
                  </label>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-semibold text-gray-600">Home Loan Interest</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={sim.homeLoan}
                    onClick={() => setSim((s) => ({ ...s, homeLoan: !s.homeLoan }))}
                    className={`relative w-12 h-7 rounded-full transition-colors ${sim.homeLoan ? "bg-indigo-600" : "bg-gray-200"}`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        sim.homeLoan ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-inner">
                <p className="text-xs font-bold text-emerald-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-600" />
                  Recalculated (Old Regime)
                </p>
                <ul className="space-y-3 text-xs">
                  {[
                    ["Taxable Income", formatInr(data.old.taxableIncome)],
                    ["Tax Payable", formatInr(data.old.totalTax)],
                    ["Savings vs New", formatInr(data.savings)],
                    [
                      "Refund / Due",
                      data.old.refund > 0
                        ? `Refund ${formatInr(data.old.refund)}`
                        : data.old.additionalTax > 0
                          ? `Due ${formatInr(data.old.additionalTax)}`
                          : "Balanced",
                    ],
                  ].map(([k, v]) => (
                    <li key={k} className="flex justify-between gap-3 border-b border-emerald-100/80 pb-2 last:border-0">
                      <span className="text-gray-600 font-medium">{k}</span>
                      <span className="font-bold text-gray-900 text-right tabular-nums">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom: four chart cards — single row on xl */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-bold text-gray-900 mb-1">Income Breakdown</p>
              <p className="text-[10px] text-gray-400 mb-2">Annual CTC split</p>
              <ClientOnly fallback={<div className="h-[150px] bg-gray-50 rounded-lg" />}>
                <DonutChart
                  data={data.incomeBreakdown}
                  centerLabel="Annual CTC"
                  centerValue={formatInr(data.annualCtc)}
                />
                <ul className="mt-1 space-y-0.5 border-t border-gray-50 pt-2">
                  {data.incomeBreakdown.map((i) => (
                    <li key={i.name} className="flex justify-between text-[10px] text-gray-500">
                      <span>{i.name}</span>
                      <span className="font-semibold text-gray-700">{i.percent}%</span>
                    </li>
                  ))}
                </ul>
              </ClientOnly>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-bold text-gray-900 mb-1">Deduction Breakdown</p>
              <p className="text-[10px] text-gray-400 mb-2">Old Regime</p>
              <ClientOnly fallback={<div className="h-[150px] bg-gray-50 rounded-lg" />}>
                <DonutChart
                  data={data.deductionBreakdown}
                  centerLabel="Total"
                  centerValue={formatInr(data.old.totalDeductions)}
                  tone="green"
                />
              </ClientOnly>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-bold text-gray-900 mb-2">Tax Slab Comparison</p>
              <ClientOnly fallback={<div className="h-[160px] bg-gray-50 rounded-lg" />}>
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.slabComparison} barGap={4} margin={{ left: -18, right: 4 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} interval={0} />
                      <YAxis hide />
                      <Tooltip formatter={(v) => formatInr(v)} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                      <Bar dataKey="old" name="Old" fill={GREEN} radius={[3, 3, 0, 0]} maxBarSize={14} />
                      <Bar dataKey="new" name="New" fill={PURPLE} radius={[3, 3, 0, 0]} maxBarSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ClientOnly>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-bold text-gray-900 mb-2">Monthly Tax Projection</p>
              <ClientOnly fallback={<div className="h-[160px] bg-gray-50 rounded-lg" />}>
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthlyProjection}>
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip formatter={(v) => formatInr(v)} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                      <Line type="monotone" dataKey="oldTax" name="Old" stroke={GREEN} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="newTax" name="New" stroke={PURPLE} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ClientOnly>
            </div>
          </div>
        </div>

        {/* Right rail — AI + Key Summary (sticky) */}
        <aside className="w-full xl:w-[300px] shrink-0 xl:sticky xl:top-4 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 leading-tight">AI Tax Copilot</h3>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Beta</span>
              </div>
            </div>

            <div className="flex items-start gap-3 mt-4 pb-4 border-b border-gray-100">
              <TaxHealthRing score={data.taxHealthScore} />
              <div className="min-w-0 pt-1">
                <p className="text-2xl font-bold text-gray-900 leading-none">{data.taxHealthScore}/100</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-snug">
                  {data.taxHealthScore >= 70
                    ? "Great! You&apos;re on track with your tax planning."
                    : "Add salary and proofs to improve your score."}
                </p>
                <Link href="/onboarding" className="text-[11px] font-semibold text-indigo-600 mt-2 inline-block hover:underline">
                  Improve Score
                </Link>
              </div>
            </div>

            <p className="text-[11px] font-bold text-gray-700 mt-4 mb-2">Suggested Questions</p>
            <ul className="space-y-1.5 mb-4">
              {[
                `Why is ${data.recommended} regime better for me?`,
                "How can I save more tax this year?",
                "What documents should I keep ready?",
              ].map((q) => (
                <li key={q}>
                  <Link
                    href={`/taxation/ai-copilot?q=${encodeURIComponent(q)}`}
                    className="block text-[11px] text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-100 rounded-lg px-3 py-2 font-medium leading-snug transition-colors"
                  >
                    {q}
                  </Link>
                </li>
              ))}
            </ul>

            <form onSubmit={submitCopilot} className="flex gap-2">
              <input
                type="text"
                value={copilotQuestion}
                onChange={(e) => setCopilotQuestion(e.target.value)}
                placeholder="Ask your tax question..."
                className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2.5 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
              />
              <button
                type="submit"
                className="shrink-0 w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 shadow-sm"
                aria-label="Send"
              >
                <Send size={16} />
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Key Summary</h3>
            <ul className="space-y-3 text-xs">
              {[
                ["Salary (CTC)", formatInr(data.keySummary.salaryCtc)],
                ["Total Deductions (Old)", formatInr(data.keySummary.totalDeductionsOld)],
                ["Taxable Income (Old)", formatInr(data.keySummary.taxableIncomeOld)],
                ["Taxable Income (New)", formatInr(data.keySummary.taxableIncomeNew)],
              ].map(([k, v]) => (
                <li key={k} className="flex justify-between gap-2 border-b border-gray-50 pb-2 last:border-0">
                  <span className="text-gray-500 font-medium">{k}</span>
                  <span className="font-semibold text-gray-900 tabular-nums text-right">{v}</span>
                </li>
              ))}
              <li className="flex justify-between gap-2 pt-1">
                <span className="text-gray-900 font-bold">You Save (Old vs New)</span>
                <span className="font-bold text-emerald-600 tabular-nums">{formatInr(data.keySummary.youSave)}</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-6px_24px_rgba(0,0,0,0.06)] lg:left-[240px]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => chooseRegime("old")}
            className={`flex-1 sm:flex-none sm:min-w-[200px] flex items-center justify-center gap-2 py-3 px-5 rounded-lg text-sm font-bold transition-all ${
              preferred === "old"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            }`}
          >
            <Check size={18} strokeWidth={2.5} />
            Choose Old Regime
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => chooseRegime("new")}
            className={`flex-1 sm:flex-none sm:min-w-[200px] flex items-center justify-center gap-2 py-3 px-5 rounded-lg text-sm font-bold border-2 transition-all ${
              preferred === "new"
                ? "border-indigo-600 bg-indigo-50 text-indigo-800"
                : "border-gray-300 bg-white text-gray-800 hover:border-indigo-300 hover:bg-indigo-50/50"
            }`}
          >
            <X size={18} strokeWidth={2.5} />
            Choose New Regime
          </button>
          <div className="flex flex-1 flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6 text-sm">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 font-semibold text-gray-600 hover:text-indigo-600"
            >
              <Download size={16} />
              Download Detailed Report
            </button>
            <Link
              href="/taxation/ai-copilot"
              className="flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <Sparkles size={16} />
              Ask AI Advisor
              <ChevronRight size={14} className="opacity-70" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
