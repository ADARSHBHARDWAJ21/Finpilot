"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, ShieldCheck, ArrowRight, Bell, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";

export default function ComingSoon({ title, subtitle, features = [] }) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [monthlySip, setMonthlySip] = useState(25000);
  const [years, setYears] = useState(10);

  // Compute compound interest for preview
  const rate = 0.13; // 13% expected CAGR for Indian equity
  const totalMonths = years * 12;
  const monthlyRate = rate / 12;
  const investedAmount = monthlySip * totalMonths;
  const futureValue =
    monthlySip * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
  const estimatedReturns = Math.max(0, futureValue - investedAmount);

  const defaultFeatures = [
    "Direct CAS (CAMS & KFintech) automatic portfolio sync",
    "Real-time XIRR vs Nifty 50 benchmark tracking",
    "LTCG & STCG tax harvesting recommendations before March 31",
    "Asset rebalancing alerts (Equity, Debt, Gold, Real Estate)",
  ];

  const displayFeatures = features.length > 0 ? features : defaultFeatures;

  const handleNotify = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-8 sm:p-12 overflow-hidden shadow-2xl border border-indigo-800/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300 mb-4">
          <Sparkles size={13} />
          <span>Next-Gen Module In Development</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {title} Engine
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
          {subtitle ||
            `We are engineering India's most advanced autonomous ${title.toLowerCase()} optimization engine with automated tax harvesting and real-time bank feeds.`}
        </p>

        {/* Feature Points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-800">
          {displayFeatures.map((feat, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-300 font-medium">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        {/* Early Access Form */}
        <div className="mt-8 max-w-md">
          {subscribed ? (
            <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 font-bold flex items-center gap-2">
              <CheckCircle2 size={16} />
              You&apos;re on the VIP priority rollout list! We&apos;ll notify you first.
            </div>
          ) : (
            <form onSubmit={handleNotify} className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Enter your email for early beta access"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-slate-400 outline-none focus:border-indigo-400 transition-colors"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all shrink-0"
              >
                Join Beta
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Interactive Wealth Simulation Sandbox */}
      <div className="mt-8 bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Interactive Preview
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1 tracking-tight">
              Autonomous Wealth Projection Simulator
            </h2>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
            @ 13% Nifty CAGR
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
                <span>Monthly Investment / SIP</span>
                <span className="font-extrabold text-indigo-600">
                  ₹{monthlySip.toLocaleString("en-IN")}/mo
                </span>
              </div>
              <input
                type="range"
                min={5000}
                max={200000}
                step={5000}
                value={monthlySip}
                onChange={(e) => setMonthlySip(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
                <span>Horizon (Years)</span>
                <span className="font-extrabold text-indigo-600">{years} Years</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-3">
            <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Projected Portfolio Value
            </p>
            <p className="text-3xl font-extrabold text-slate-900">
              ₹{(futureValue / 100000).toFixed(2)} Lakhs
            </p>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200 text-xs">
              <div>
                <p className="text-slate-400">Amount Invested</p>
                <p className="font-bold text-slate-800">
                  ₹{(investedAmount / 100000).toFixed(2)}L
                </p>
              </div>
              <div>
                <p className="text-emerald-700 font-semibold">Wealth Gain (Est.)</p>
                <p className="font-bold text-emerald-700">
                  +₹{(estimatedReturns / 100000).toFixed(2)}L
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
