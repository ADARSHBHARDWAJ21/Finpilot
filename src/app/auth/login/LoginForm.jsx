"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "../actions";
import { AuthShell } from "@/components/auth/AuthForm";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

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


  return (
    <AuthShell
      title="Welcome back."
      subtitle="A clearer view of your money is waiting for you."
      footer={
        <>
          Don&apos;t have an account yet?{" "}
          <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
            Create an account
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
        <div role="alert" className="mb-4 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              className="w-full pl-10 pr-3.5 py-3 bg-white border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="text-xs font-semibold text-foreground">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-3 bg-white border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#647268] p-1"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className=" mt-2 w-full py-3 bg-primary hover:bg-[#193e35] disabled:opacity-60 text-white font-semibold rounded-xl transition-all   text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            "Authenticating…"
          ) : (
            <>
              <span>Sign in to your workspace</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
      <input type="hidden" name="next" value={nextPath} readOnly className="hidden" />
    </AuthShell>
  );
}
