"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "../actions";
import { AuthShell } from "@/components/auth/AuthForm";
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signUp(email, password);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || "Signup failed");
      setLoading(false);
    }
  }

  const isPasswordLong = password.length >= 6;

  return (
    <AuthShell
      title="Make yourself at home."
      subtitle="Create your account and bring your finances together."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">
            Sign In
          </Link>
        </>
      }
    >
      {error && (
        <div role="alert" className="mb-4 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="flex flex-col gap-5">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1">
            Work or Personal Email
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
          <label htmlFor="password" className="block text-xs font-semibold text-foreground mb-1">
            Password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="At least 6 characters"
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
          {/* Helper checklist */}
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
            <CheckCircle2
              size={13}
              className={isPasswordLong ? "text-emerald-500" : "text-slate-300"}
            />
            <span className={isPasswordLong ? "text-foreground font-medium" : ""}>
              At least 6 characters
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className=" mt-2 w-full py-3 bg-primary hover:bg-[#193e35] disabled:opacity-60 text-white font-semibold rounded-xl transition-all   text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            "Creating secure workspace…"
          ) : (
            <>
              <span>Create account</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <p className="text-[11px] text-muted-foreground text-center mt-1 leading-relaxed">
          You can update your financial details in Settings at any time.
        </p>
      </form>
    </AuthShell>
  );
}
