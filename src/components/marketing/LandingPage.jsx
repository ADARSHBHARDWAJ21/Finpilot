"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Shield,
  BarChart3,
  Bot,
  Landmark,
  ArrowRight,
  CheckCircle2,
  CalendarClock,
  Target,
  Wallet,
  BrainCircuit,
  IndianRupee,
  TrendingUp,
  Percent,
  Calculator,
  ChevronRight,
  Star,
  Check,
  Zap,
  Lock,
  FileSpreadsheet,
  HelpCircle,
  ChevronDown,
  Layers,
  Flame,
} from "lucide-react";

export default function LandingPage() {
  // Interactive Live Tax Simulator State
  const [annualSalary, setAnnualSalary] = useState(1800000); // 18 LPA default
  const [deduction80C, setDeduction80C] = useState(150000);
  const [deduction80D, setDeduction80D] = useState(25000);
  const [annualRent, setAnnualRent] = useState(300000);
  const [npsContribution, setNpsContribution] = useState(50000);
  const [activeTab, setActiveTab] = useState("overview");
  const [openFaq, setOpenFaq] = useState(null);

  // Compute live tax estimates for New vs Old Regime (FY 2024-25 / 2025-26 Indian slabs)
  const simulation = useMemo(() => {
    // New Regime (Standard deduction ₹75,000)
    const stdNew = 75000;
    const taxableNew = Math.max(0, annualSalary - stdNew);
    let taxNew = 0;

    // Slabs: 0-3L: nil, 3-7L: 5%, 7-10L: 10%, 10-12L: 15%, 12-15L: 20%, >15L: 30%
    if (taxableNew <= 700000) {
      taxNew = 0; // Section 87A rebate up to 7L
    } else {
      if (taxableNew > 300000) taxNew += Math.min(400000, taxableNew - 300000) * 0.05;
      if (taxableNew > 700000) taxNew += Math.min(300000, taxableNew - 700000) * 0.1;
      if (taxableNew > 1000000) taxNew += Math.min(200000, taxableNew - 1000000) * 0.15;
      if (taxableNew > 1200000) taxNew += Math.min(300000, taxableNew - 1200000) * 0.2;
      if (taxableNew > 1500000) taxNew += (taxableNew - 1500000) * 0.3;
      taxNew = taxNew * 1.04; // 4% cess
    }

    // Old Regime (Standard deduction ₹50,000 + 80C + 80D + HRA approx 40% of rent + NPS 80CCD(1B))
    const stdOld = 50000;
    const hraExemption = Math.min(annualRent * 0.5, annualRent - annualSalary * 0.1 > 0 ? annualRent - annualSalary * 0.1 : 0);
    const totalDeductions = stdOld + deduction80C + deduction80D + hraExemption + npsContribution;
    const taxableOld = Math.max(0, annualSalary - totalDeductions);
    let taxOld = 0;

    if (taxableOld <= 500000) {
      taxOld = 0;
    } else {
      if (taxableOld > 250000) taxOld += Math.min(250000, taxableOld - 250000) * 0.05;
      if (taxableOld > 500000) taxOld += Math.min(500000, taxableOld - 500000) * 0.2;
      if (taxableOld > 1000000) taxOld += (taxableOld - 1000000) * 0.3;
      taxOld = taxOld * 1.04;
    }

    const difference = Math.abs(Math.round(taxOld - taxNew));
    const recommended = taxNew <= taxOld ? "New Regime" : "Old Regime";
    const recommendedTax = Math.round(Math.min(taxNew, taxOld));

    return {
      taxNew: Math.round(taxNew),
      taxOld: Math.round(taxOld),
      savings: difference,
      recommended,
      recommendedTax,
      totalDeductions: Math.round(totalDeductions),
    };
  }, [annualSalary, deduction80C, deduction80D, annualRent, npsContribution]);

  const features = [
    {
      icon: BrainCircuit,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50 text-indigo-600",
      badge: "Autonomous AI",
      title: "AI Financial Copilot",
      description:
        "Analyzes your payslips, bank statements, and investments in real time to generate hyper-personalized money moves and salary structure advice.",
    },
    {
      icon: Landmark,
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50 text-emerald-600",
      badge: "Save ₹40k - ₹1.5L",
      title: "Tax Regime Intelligence",
      description:
        "Continuous side-by-side simulation of Old vs New Tax Regime with instant 80C, 80D, HRA, and NPS gap detection before payroll cutoff dates.",
    },
    {
      icon: Wallet,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50 text-amber-600",
      badge: "Leak Detector",
      title: "Cash Flow & Expense Radar",
      description:
        "Automatically categorizes UPI, card, and netbanking transactions to detect lifestyle inflation, hidden subscriptions, and month-end cash crunches.",
    },
    {
      icon: Target,
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50 text-purple-600",
      badge: "Affordability AI",
      title: "Goal & EMI Simulator",
      description:
        "Thinking of buying a car, house, or booking a dream vacation? FinCopilot stress-tests your disposable runway before you take on debt.",
    },
    {
      icon: CalendarClock,
      color: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-50 text-blue-600",
      badge: "Zero Late Fees",
      title: "Live Compliance Calendar",
      description:
        "Never miss Advance Tax Q1-Q4 deadlines, ITR filing dates, quarterly AIS reconciliations, or company proof submission windows.",
    },
    {
      icon: BarChart3,
      color: "from-rose-500 to-red-600",
      bgColor: "bg-rose-50 text-rose-600",
      badge: "Executive Grade",
      title: "Consolidated Net Worth",
      description:
        "Unified view of EPF, PPF, Mutual Funds, Fixed Deposits, Stocks, and Real Estate with historical growth trajectory and asset allocation balance.",
    },
  ];

  const testimonials = [
    {
      quote:
        "FinCopilot saved me ₹68,400 this financial year by proving New Regime was actually better once my HRA was factored against my home loan. The AI Copilot is like having a private CA in my pocket.",
      name: "Rohan Mukherjee",
      role: "Staff Software Engineer, Google",
      avatar: "RM",
      rating: 5,
      saving: "Saved ₹68,400",
    },
    {
      quote:
        "I used to track taxes in chaotic Google Sheets every February. FinCopilot connects my monthly salary slips and sends me exact action items before HR declaration deadlines. Invaluable!",
      name: "Ananya Sharma",
      role: "Product Lead, Swiggy",
      avatar: "AS",
      rating: 5,
      saving: "Saved 40+ Hours",
    },
    {
      quote:
        "The EMI affordability simulator stopped me from overextending on a 35L car loan. It clearly showed how my emergency fund runway would be compressed. Best financial tool for Indian professionals.",
      name: "Vikram Singhania",
      role: "VP Engineering, Fintech Startup",
      avatar: "VS",
      rating: 5,
      saving: "Protected Runway",
    },
  ];

  const faqs = [
    {
      q: "Is FinCopilot safe? How is my financial data protected?",
      a: "Yes, completely. FinCopilot uses enterprise-grade 256-bit AES encryption at rest and TLS 1.3 in transit. We never sell your data, and we do not store your banking credentials. Your data belongs exclusively to you.",
    },
    {
      q: "How does FinCopilot determine whether Old or New Regime is better?",
      a: "FinCopilot factors in your base salary, HRA component, actual metro/non-metro rent paid, 80C deductions (EPF, ELSS, PPF), 80D health insurance, and 80CCD(1B) NPS. It runs parallel calculations through the latest Indian Income Tax Act rules to give you the exact mathematical winner.",
    },
    {
      q: "Can I import bank statements and payslips?",
      a: "Yes! You can upload PDF/CSV bank statements and salary slips. Our OCR and parser automatically extract transactions, income deductions, and tax withholdings with 99.4% accuracy.",
    },
    {
      q: "Can FinCopilot help me plan Advance Tax for stock options or capital gains?",
      a: "Absolutely. FinCopilot tracks your advance tax installment deadlines (June 15, Sept 15, Dec 15, March 15) and notifies you before penal interest under sections 234B & 234C kicks in.",
    },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Ambient glowing background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/4 -right-40 w-[30rem] h-[30rem] bg-purple-500/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      {/* Floating Navbar */}
      <header className="sticky top-0 z-50 px-4 sm:px-6 pt-3 pb-2">
        <div className="max-w-6xl mx-auto glass-panel rounded-2xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4 border border-slate-200/70 shadow-sm">
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">FinCopilot</span>
                <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100/80">
                  AI 2.0
                </span>
              </div>
              <p className="hidden md:block text-[10px] text-slate-500">Autonomous Wealth & Tax</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#simulator" className="hover:text-indigo-600 transition-colors">
              Tax Simulator
            </a>
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Platform Features
            </a>
            <a href="#comparison" className="hover:text-indigo-600 transition-colors">
              Why FinCopilot
            </a>
            <a href="#testimonials" className="hover:text-indigo-600 transition-colors">
              Reviews
            </a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              href="/auth/login"
              className="px-3.5 sm:px-4 py-2 text-sm font-semibold text-slate-700 rounded-xl hover:bg-slate-100/80 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="btn-shimmer px-4 sm:px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 z-10">
        {/* HERO SECTION */}
        <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center">
          {/* Beacon pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-slate-200/80 shadow-xs mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-beacon" />
            <span className="text-xs font-semibold text-slate-800">
              🇮🇳 India&apos;s #1 Autonomous AI Finance & Tax Copilot
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              FY 2024-26 Ready
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Your Taxes, Wealth &amp; Cash Flow —{" "}
            <span className="text-gradient-vibrant">Orchestrated by Autonomous AI</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Stop juggling spreadsheets and chaotic CA calls. FinCopilot connects your salary, bank
            statements, deductions, and goals into a unified real-time decision engine.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/auth/signup"
              className="btn-shimmer w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all text-base"
            >
              Start Free Today
              <ArrowRight size={18} />
            </Link>
            <a
              href="#simulator"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/90 border border-slate-200 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 transition-colors shadow-xs text-base"
            >
              <Calculator size={18} className="text-indigo-600" />
              Try Live Tax Simulator
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Shield size={16} className="text-emerald-500" />
              <span>256-Bit Bank Grade Encryption</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-indigo-500" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={16} className="text-amber-500" />
              <span>Built Specially for Indian Salaried Pros</span>
            </div>
          </div>

          {/* Social Proof Strip */}
          <div className="mt-12 pt-8 border-t border-slate-200/60 max-w-4xl mx-auto">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-5">
              Trusted by 18,000+ engineers, product leaders, &amp; founders from
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-75 grayscale hover:grayscale-0 transition-all duration-300">
              <span className="font-bold text-base text-slate-600">GOOGLE</span>
              <span className="font-bold text-base text-slate-600">MICROSOFT</span>
              <span className="font-bold text-base text-slate-600">INFOSYS</span>
              <span className="font-bold text-base text-slate-600">FLIPKART</span>
              <span className="font-bold text-base text-slate-600">SWIGGY</span>
              <span className="font-bold text-base text-slate-600">ZERODHA</span>
            </div>
          </div>
        </section>

        {/* SECTION: INTERACTIVE LIVE TAX SIMULATOR */}
        <section id="simulator" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-indigo-100 shadow-xl relative overflow-hidden bg-white/95">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-10">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mb-3">
                <Calculator size={14} />
                Live Regime Engine
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Simulate Your Tax in Real-Time
              </h2>
              <p className="text-sm sm:text-base text-slate-500 mt-2">
                Slide your annual CTC and deductions below. See instantly which regime saves you more
                money before HR freezes your choices.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Controls Column */}
              <div className="lg:col-span-7 space-y-6">
                {/* CTC Slider */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Annual Gross Salary (CTC)
                    </label>
                    <span className="text-base sm:text-lg font-extrabold text-indigo-600">
                      ₹{(annualSalary / 100000).toFixed(1)} Lakhs{" "}
                      <span className="text-xs text-slate-400 font-normal">
                        (₹{annualSalary.toLocaleString("en-IN")})
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={600000}
                    max={5000000}
                    step={50000}
                    value={annualSalary}
                    onChange={(e) => setAnnualSalary(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
                    <span>₹6 LPA</span>
                    <span>₹18 LPA</span>
                    <span>₹30 LPA</span>
                    <span>₹50 LPA</span>
                  </div>
                </div>

                {/* Deductions Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 80C */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-slate-700">Section 80C</span>
                      <span className="text-xs font-bold text-slate-900">
                        ₹{deduction80C.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={150000}
                      step={10000}
                      value={deduction80C}
                      onChange={(e) => setDeduction80C(Number(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">EPF, ELSS, PPF, Life Insurance</p>
                  </div>

                  {/* 80D */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-slate-700">Section 80D (Health)</span>
                      <span className="text-xs font-bold text-slate-900">
                        ₹{deduction80D.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={75000}
                      step={5000}
                      value={deduction80D}
                      onChange={(e) => setDeduction80D(Number(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Self &amp; Parents Health Mediclaim</p>
                  </div>

                  {/* Rent paid */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-slate-700">Annual Rent Paid (HRA)</span>
                      <span className="text-xs font-bold text-slate-900">
                        ₹{annualRent.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={720000}
                      step={20000}
                      value={annualRent}
                      onChange={(e) => setAnnualRent(Number(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Rent receipts for HRA claim</p>
                  </div>

                  {/* NPS */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-slate-700">NPS 80CCD(1B)</span>
                      <span className="text-xs font-bold text-slate-900">
                        ₹{npsContribution.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={50000}
                      step={5000}
                      value={npsContribution}
                      onChange={(e) => setNpsContribution(Number(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">National Pension Scheme extra 50k</p>
                  </div>
                </div>
              </div>

              {/* Live Outcome Card */}
              <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-2xl relative overflow-hidden border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Copilot Verdict
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles size={12} />
                    {simulation.recommended} is Winner
                  </span>
                </div>

                <div className="my-5">
                  <p className="text-xs text-slate-400">Potential Tax Savings</p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
                    ₹{simulation.savings.toLocaleString("en-IN")}
                    <span className="text-xs font-medium text-slate-300 ml-1.5">/year</span>
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800/80 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">New Regime Tax</span>
                    <span className="font-semibold text-slate-200">
                      ₹{simulation.taxNew.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Old Regime Tax</span>
                    <span className="font-semibold text-slate-200">
                      ₹{simulation.taxOld.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Old Regime Deductions Total</span>
                    <span className="font-semibold text-indigo-300">
                      ₹{simulation.totalDeductions.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                  <span className="font-bold text-white flex items-center gap-1.5 mb-1">
                    <Bot size={14} className="text-indigo-400" />
                    AI Action Tip:
                  </span>
                  {simulation.recommended === "New Regime"
                    ? `Choosing the New Tax Regime saves you ₹${simulation.savings.toLocaleString(
                        "en-IN"
                      )} because your deductions do not cross the ₹4.25L break-even threshold.`
                    : `Stick to the Old Tax Regime! Your heavy HRA and 80C/80D deductions save you ₹${simulation.savings.toLocaleString(
                        "en-IN"
                      )} compared to the new tax slabs.`}
                </div>

                <Link
                  href="/auth/signup"
                  className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-lg shadow-indigo-500/25"
                >
                  Save This Plan in FinCopilot
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: INTERACTIVE COMMAND CENTER PREVIEW */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mb-3">
              <Layers size={14} />
              Command Center
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              A Living Financial Dashboard That Never Sleeps
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2">
              Everything in one elegant view: your cash flow, net worth trajectory, tax liability, and
              AI next steps.
            </p>
          </div>

          {/* Interactive Mockup Container */}
          <div className="glass-panel rounded-3xl border border-slate-200/90 shadow-2xl p-4 sm:p-6 bg-white/95 overflow-hidden">
            {/* Window controls bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-slate-400 ml-2">
                  FinCopilot Command View • Live
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === "overview" ? "bg-white text-indigo-600 shadow-xs" : "hover:text-slate-900"
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("tax")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === "tax" ? "bg-white text-indigo-600 shadow-xs" : "hover:text-slate-900"
                  }`}
                >
                  Tax AI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("copilot")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === "copilot" ? "bg-white text-indigo-600 shadow-xs" : "hover:text-slate-900"
                  }`}
                >
                  Copilot Chat
                </button>
              </div>
            </div>

            {/* Simulated Content based on activeTab */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Metric Card 1 */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-white border border-indigo-100/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Net Worth</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      +14.8%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">₹42,80,000</p>
                  <p className="text-xs text-slate-400 mt-1">₹34.5L liquid • ₹8.3L investments</p>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full w-[78%]" />
                  </div>
                </div>

                {/* Metric Card 2 */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-100/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Monthly Cash Flow</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Healthy
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">+₹53,640</p>
                  <p className="text-xs text-slate-400 mt-1">Savings rate: 42.6% of ₹1.28L income</p>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[65%]" />
                  </div>
                </div>

                {/* Metric Card 3 */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/60 to-white border border-purple-100/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Tax Health Score</span>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Optimized
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">92 / 100</p>
                  <p className="text-xs text-slate-400 mt-1">Zero pending notices • Advance tax paid</p>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full w-[92%]" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tax" && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h4 className="font-bold text-slate-900">FY 2024-25 Regime Optimization</h4>
                    <p className="text-xs text-slate-500">
                      Automatically calculated from your Form 16, payslips, and HRA proofs
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 self-start sm:self-auto">
                    Recommended: New Regime (Saves ₹34,200)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <p className="text-[10px] text-slate-400">Total Salary</p>
                    <p className="text-sm font-bold text-slate-800">₹24,00,000</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <p className="text-[10px] text-slate-400">TDS Deducted</p>
                    <p className="text-sm font-bold text-slate-800">₹2,82,400</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <p className="text-[10px] text-slate-400">Calculated Liability</p>
                    <p className="text-sm font-bold text-slate-800">₹2,58,000</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                    <p className="text-[10px] text-emerald-700 font-semibold">Expected Refund</p>
                    <p className="text-sm font-bold text-emerald-700">₹24,400</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "copilot" && (
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                    You
                  </div>
                  <div className="bg-slate-800 p-3 rounded-2xl text-xs text-slate-200 max-w-lg">
                    &quot;Can I afford to buy a ₹16 Lakh car with a ₹24,000 monthly EMI right now?&quot;
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-indigo-950/80 border border-indigo-500/30 p-3.5 rounded-2xl text-xs text-slate-200 max-w-xl space-y-2">
                    <p>
                      <strong className="text-indigo-300">Analysis:</strong> Yes, you can safely afford
                      it.
                    </p>
                    <p className="text-slate-300">
                      Your current monthly surplus is <strong className="text-white">₹53,640</strong>. A
                      ₹24k EMI will consume 44% of your monthly free cash flow, leaving ₹29,640 intact.
                      Your 6-month emergency reserve (₹4.8L in liquid FD) remains completely protected.
                    </p>
                    <p className="text-[11px] text-indigo-400">
                      💡 Copilot Recommendation: Opt for 4-year tenure instead of 5 to save ₹48,000 in
                      total interest.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION: 6 CORE VALUE PILLARS */}
        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mb-3">
              <Sparkles size={14} />
              Intelligent Suite
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered Specifically for Indian Salaried Wealth
            </h2>
            <p className="text-slate-500 mt-3 text-base">
              Generic global finance apps do not understand Form 16, AIS, Section 80C, or Advance Tax.
              FinCopilot was built from the ground up for the Indian tax code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="glass-panel glass-panel-hover rounded-3xl p-6 sm:p-7 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.bgColor} shadow-sm group-hover:scale-110 transition-transform`}>
                        <Icon size={24} />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                    <span>Explore module</span>
                    <ChevronRight size={15} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION: COMPARISON TABLE */}
        <section id="comparison" className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-10">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mb-3">
                <Flame size={14} />
                Unfair Advantage
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                How FinCopilot Compares
              </h2>
              <p className="text-sm sm:text-base text-slate-500 mt-2">
                Why thousands of salaried professionals are switching from static spreadsheets and
                tax-season panic.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-4 px-4 font-bold text-slate-900 w-1/3">Feature</th>
                    <th className="py-4 px-4 font-semibold text-slate-400 w-1/3">
                      Spreadsheets &amp; Legacy Tax Sites
                    </th>
                    <th className="py-4 px-4 font-extrabold text-indigo-600 bg-indigo-50/50 rounded-t-xl w-1/3">
                      FinCopilot Autonomous AI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    {
                      feat: "Tax Regime Optimization",
                      old: "Static calculator at end of year",
                      fin: "Live 365-day tracking with deduction gap alerts",
                    },
                    {
                      feat: "Document Parsing",
                      old: "Manual data entry or paid CA review",
                      fin: "Instant OCR extraction of Form 16 & Bank PDFs",
                    },
                    {
                      feat: "Affordability Decision Engine",
                      old: "Basic EMI math formulas",
                      fin: "Cash-flow simulated risk modeling before big spends",
                    },
                    {
                      feat: "Advance Tax & Penalties",
                      old: "Forgotten until 234B/C penal interest hits",
                      fin: "Automated quarterly calendar triggers & reminders",
                    },
                    {
                      feat: "Interactive AI Advice",
                      old: "None (Google search or waiting on CA)",
                      fin: "Instant contextual Copilot chat tuned to your finances",
                    },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-semibold text-slate-800">{row.feat}</td>
                      <td className="py-4 px-4 text-slate-500">{row.old}</td>
                      <td className="py-4 px-4 font-semibold text-indigo-700 bg-indigo-50/30 flex items-center gap-2">
                        <Check size={16} className="text-emerald-500 shrink-0" />
                        <span>{row.fin}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION: TESTIMONIALS */}
        <section id="testimonials" className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mb-3">
              <Star size={14} className="fill-indigo-600" />
              Wall of Trust
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Loved by Engineers, PMs, &amp; Executives
            </h2>
            <p className="text-slate-500 mt-2 text-sm sm:text-base">
              Real stories from users who saved thousands and eliminated financial stress.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="glass-panel rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-slate-200/80 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1 text-amber-400">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} size={16} className="fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                      {t.saving}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    &quot;{t.quote}&quot;
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t.name}</p>
                    <p className="text-[11px] text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: FAQ ACCORDION */}
        <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mb-3">
              <HelpCircle size={14} />
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-all shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 hover:text-indigo-600 transition-colors text-sm sm:text-base"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 shrink-0 transition-transform ${
                        isOpen ? "rotate-180 text-indigo-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CLOSING HIGH-CONVERTING CTA BANNER */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
          <div className="relative rounded-3xl bg-gradient-to-tr from-indigo-900 via-indigo-700 to-violet-800 text-white p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
            {/* Shimmer light effect */}
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-200 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 mb-4">
              <Sparkles size={14} className="text-amber-300" />
              Instant Setup in Under 2 Minutes
            </span>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto">
              Ready to Save Real Tax &amp; Master Your Wealth?
            </h2>
            <p className="mt-4 text-indigo-100 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Join thousands of Indian salaried professionals who make confident financial moves with
              their personal AI Copilot.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-all shadow-xl text-base hover:scale-105"
              >
                Get Started Free
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/auth/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-indigo-950/60 text-white font-semibold rounded-2xl hover:bg-indigo-950/80 border border-white/20 transition-all text-base"
              >
                Sign In to Account
              </Link>
            </div>

            <p className="mt-5 text-xs text-indigo-200">
              No credit card required • Encrypted bank-grade security • Free plan available
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-base">FinCopilot</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Autonomous AI financial and tax planning SaaS designed specifically for Indian salaried
              users.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="#simulator" className="hover:text-indigo-600 transition-colors">
                  Tax Simulator
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-indigo-600 transition-colors">
                  AI Copilot
                </a>
              </li>
              <li>
                <Link href="/auth/signup" className="hover:text-indigo-600 transition-colors">
                  Budget Tracker
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="hover:text-indigo-600 transition-colors">
                  Net Worth Radar
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3">Indian Tax</h4>
            <ul className="space-y-2">
              <li>Old vs New Regime Guide</li>
              <li>Section 80C &amp; 80D Checklist</li>
              <li>Advance Tax Calendar FY 25-26</li>
              <li>HRA Calculator &amp; Proofs</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3">Security &amp; Trust</h4>
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Lock size={14} className="text-emerald-500" />
                256-Bit TLS Encryption
              </p>
              <p className="text-slate-400">
                Your data is stored in ISO 27001 certified data centers. We never share or sell personal
                financial records.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
          <p>© {new Date().getFullYear()} FinCopilot. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Built with precision for Indian Salaried Wealth</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
