"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "../actions";
import { AuthShell } from "@/components/auth/AuthForm";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";

export default function LoginForm({ message, nextPath }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn(email, password, nextPath);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || "Login failed");
      setLoading(false);
    }
  }

  const fillDemo = () => {
    setEmail("demo@fincopilot.in");
    setPassword("DemoSecure123!");
  };

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Sign in to your autonomous financial copilot"
      footer={
        <>
          Don&apos;t have an account yet?{" "}
          <Link href="/auth/signup" className="text-indigo-600 font-bold hover:underline">
            Create account free
          </Link>
        </>
      }
    >
      {message && (
        <div className="mb-4 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
          {error}
        </div>
      )}

      {/* Demo Credentials Pill */}
      <div className="mb-4 p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
        <span className="flex items-center gap-1.5 font-medium text-[11px]">
          <Sparkles size={13} className="text-indigo-600" />
          Evaluating? Test drive with demo
        </span>
        <button
          type="button"
          onClick={fillDemo}
          className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 shadow-2xs transition-colors"
        >
          Fill Demo
        </button>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="text-xs font-bold text-slate-700">
              Password
            </label>
            <span className="text-[11px] text-indigo-600 font-semibold cursor-pointer hover:underline">
              Forgot?
            </span>
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-shimmer mt-2 w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            "Authenticating…"
          ) : (
            <>
              <span>Sign In to Dashboard</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
      <input type="hidden" name="next" value={nextPath} readOnly className="hidden" />
    </AuthShell>
  );
}
