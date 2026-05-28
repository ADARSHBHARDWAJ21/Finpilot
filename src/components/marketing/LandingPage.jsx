import Link from "next/link";
import {
  Sparkles,
  Shield,
  BarChart3,
  Bot,
  FileText,
  Landmark,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Landmark,
    title: "Tax planning & filing",
    description: "Compare regimes, track deductions, and stay ahead of deadlines for FY 2024-25.",
  },
  {
    icon: Bot,
    title: "AI Tax Copilot",
    description: "Get personalized answers based on your real income, TDS, and investment data.",
  },
  {
    icon: BarChart3,
    title: "Reports & insights",
    description: "Tax summaries, liability charts, and actionable insights in one dashboard.",
  },
  {
    icon: FileText,
    title: "Document vault",
    description: "Securely store Form 16, rent receipts, and proofs — organized by category.",
  },
  {
    icon: Shield,
    title: "Bank-grade security",
    description: "Encrypted storage and Indian tax compliance built into every workflow.",
  },
];

const highlights = [
  "Old vs new regime comparison",
  "Budget & expense tracking",
  "Calendar for tax deadlines",
  "AIS / TDS reconciliation",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#f8f9fc] flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 safe-top">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">FinCopilot</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link
              href="/auth/login"
              className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mb-6">
            <Sparkles size={14} />
            AI Finance & Tax Copilot for India
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight max-w-3xl mx-auto">
            Your taxes, budget, and wealth —{" "}
            <span className="text-indigo-600">one intelligent copilot</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            FinCopilot helps salaried professionals and individuals optimize taxes, track
            spending, and never miss a filing deadline. Built for Indian tax rules.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
            >
              Get Started Free
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-white transition-colors bg-white"
            >
              Login
            </Link>
          </div>
          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Features */}
        <section id="features" className="bg-white border-y border-gray-100 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
              Everything you need for financial clarity
            </h2>
            <p className="text-gray-500 text-center mt-2 max-w-xl mx-auto">
              From daily budgeting to annual ITR — designed for the Indian tax system.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="p-5 rounded-2xl border border-gray-100 bg-[#f8f9fc] hover:shadow-md transition-shadow"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                      <Icon size={20} className="text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {[
              { step: "1", title: "Create your account", desc: "Sign up in seconds with email." },
              {
                step: "2",
                title: "Connect your data",
                desc: "Upload documents or enter income & deductions.",
              },
              {
                step: "3",
                title: "Let AI guide you",
                desc: "Get insights, reminders, and tax-saving actions.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold text-lg flex items-center justify-center mx-auto">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mt-4">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 sm:p-12 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold">Ready to take control of your finances?</h2>
            <p className="mt-2 text-indigo-100 max-w-lg mx-auto">
              Join thousands of users who save more and stress less with FinCopilot.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Start for free
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 bg-white py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} FinCopilot. Your data is encrypted and secure.
      </footer>
    </div>
  );
}
