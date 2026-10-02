"use client";

import Link from "next/link";
import { Sparkles, Shield, Lock, CheckCircle2, ArrowRight } from "lucide-react";

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#f8fafc] flex flex-col relative overflow-hidden selection:bg-indigo-600 selection:text-white">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float-slow" />
      </div>

      {/* Header */}
      <header className="p-5 sm:p-6 max-w-6xl w-full mx-auto flex items-center justify-between z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">FinCopilot</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
              India
            </span>
          </div>
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          ← Back to home
        </Link>
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-md">
          <div className="glass-panel rounded-3xl border border-slate-200/90 shadow-2xl p-6 sm:p-8 bg-white/95">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
              {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">{subtitle}</p>}
            </div>

            {children}
          </div>

          {footer && (
            <div className="mt-5 text-center text-xs text-slate-500 font-medium">
              {footer}
            </div>
          )}

          {/* Security badge below card */}
          <div className="mt-8 flex items-center justify-center gap-4 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Lock size={12} className="text-emerald-500" />
              256-bit TLS Encrypted
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Shield size={12} className="text-indigo-500" />
              Strict Indian Tax Privacy
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
