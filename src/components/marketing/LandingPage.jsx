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
} from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "AI Financial Copilot",
    description:
      "Understands your salary, deductions, spending, and goals to suggest smart next actions.",
  },
  {
    icon: Landmark,
    title: "Tax Intelligence for India",
    description:
      "Regime comparison, deduction planning, advance tax tracking, and filing readiness in one place.",
  },
  {
    icon: Wallet,
    title: "Budget + Expense Command Center",
    description:
      "Track income, spending leaks, and cash flow health with practical month-wise insights.",
  },
  {
    icon: Target,
    title: "Goals & Affordability Engine",
    description:
      "Simulate EMIs, assess risk, and plan realistic timelines before making big money decisions.",
  },
  {
    icon: CalendarClock,
    title: "Real-time Reminders & Calendar",
    description:
      "Auto-generated deadlines and reminders from your entered data, so you never miss critical actions.",
  },
  {
    icon: BarChart3,
    title: "Actionable Reports",
    description:
      "Get clean dashboards for net worth, liabilities, deductions, and projections you can act on.",
  },
];

const valuePillars = [
  {
    title: "What FinCopilot does",
    description:
      "FinCopilot is a personal finance + tax SaaS for salaried Indians. It connects your income, deductions, expenses, goals, and deadlines into one intelligent system.",
  },
  {
    title: "What you get before filing season",
    description:
      "You get year-round visibility: where your money goes, what taxes are building up, what to invest in, and what to do next each month.",
  },
  {
    title: "Why this is different",
    description:
      "Not just a tax calculator. It is a decision assistant that helps you plan affordability, reduce stress, and improve financial outcomes over time.",
  },
];

const outcomes = [
  "Reduce tax outflow with smarter deduction planning",
  "Avoid missed deadlines with real-time reminders",
  "Improve savings rate with budget insights",
  "Plan goals safely with affordability simulations",
  "Track net worth growth across the full year",
];

const idealFor = [
  "Salaried professionals managing taxes + expenses",
  "Users planning EMI purchases or long-term goals",
  "Anyone who wants one dashboard for money decisions",
];

const trustItems = [
  "Encrypted data storage and secure auth",
  "Built specifically for Indian tax workflows",
  "Actionable insights, not just raw numbers",
];

const highlights = [
  "Tax + budget + goals in one workspace",
  "AI-backed insights from real user inputs",
  "Live reminders and calendar auto-updates",
  "Built for Indian salaried users",
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight max-w-4xl mx-auto">
            Your taxes, budget, goals, and wealth —{" "}
            <span className="text-indigo-600">one intelligent copilot</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-gray-500 max-w-3xl mx-auto leading-relaxed">
            FinCopilot is a financial planning SaaS built for Indian salaried users. It combines
            tax planning, expense tracking, reminders, affordability simulation, and AI guidance so
            you always know what to do next with your money.
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
            {valuePillars.map((item) => (
              <div key={item.title} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
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

        {/* Product explanation */}
        <section className="bg-white border-y border-gray-100 py-14 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#f8f9fc] border border-gray-100 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-900">How our SaaS helps you daily</h2>
              <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                Instead of opening multiple apps for taxes, spending, and planning, FinCopilot
                gives you a single system that turns your inputs into actionable financial guidance.
              </p>
              <ul className="mt-5 space-y-2">
                {outcomes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#f8f9fc] border border-gray-100 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900">Who FinCopilot is for</h3>
              <ul className="mt-4 space-y-3">
                {idealFor.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <IndianRupee size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-900">Trust & reliability</p>
                <ul className="mt-2 space-y-1.5">
                  {trustItems.map((item) => (
                    <li key={item} className="text-xs text-gray-500">
                      • {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Start with your financial profile
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-white border-y border-gray-100 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
              Everything you need for financial clarity
            </h2>
            <p className="text-gray-500 text-center mt-2 max-w-xl mx-auto">
              From daily budgeting to annual ITR and goal planning - designed for real Indian
              finance workflows.
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
