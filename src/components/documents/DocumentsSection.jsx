"use client";

import {
  Search,
  Upload,
  Plus,
  Bell,
  FileText,
  AlertCircle,
  Calendar,
  Cloud,
  Briefcase,
  PiggyBank,
  Home,
  Landmark,
  Shield,
  MoreHorizontal,
  ChevronRight,
  Sparkles,
  MessageCircle,
  Share2,
  Download,
  Settings,
  Package,
  FileBarChart,
  FileCheck,
  TrendingUp,
  Lock,
} from "lucide-react";

function ReadinessRing({ percent }) {
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width="48" height="48" className="-rotate-90 shrink-0">
      <circle cx="24" cy="24" r="18" fill="none" stroke="#f3f4f6" strokeWidth="4" />
      <circle
        cx="24"
        cy="24"
        r="18"
        fill="none"
        stroke="#22c55e"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

const summaryStats = [
  {
    label: "Total Documents",
    value: "128",
    icon: FileText,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    label: "Tax Readiness",
    value: "78%",
    ring: true,
    iconBg: "",
    iconColor: "",
  },
  {
    label: "Missing Documents",
    value: "9",
    valueColor: "text-red-500",
    icon: AlertCircle,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
  {
    label: "Last Uploaded",
    value: "2 May 2024",
    icon: Calendar,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    valueSize: "text-lg",
  },
  {
    label: "Storage Used",
    value: "284 MB of 5 GB",
    progress: 5.68,
    icon: Cloud,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    valueSize: "text-xs",
  },
];

const categories = [
  {
    title: "Salary Documents",
    desc: "Form 16, salary slips, employer proofs",
    count: 32,
    icon: Briefcase,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    border: "hover:border-indigo-200",
  },
  {
    title: "Tax Saving Proofs",
    desc: "80C, 80D, NPS, ELSS certificates",
    count: 28,
    icon: PiggyBank,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    border: "hover:border-emerald-200",
  },
  {
    title: "Rent & HRA",
    desc: "Rent receipts, lease agreements",
    count: 18,
    icon: Home,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    border: "hover:border-orange-200",
  },
  {
    title: "Banking & Investments",
    desc: "Statements, capital gains, FD proofs",
    count: 35,
    icon: Landmark,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    border: "hover:border-blue-200",
  },
  {
    title: "Compliance & Filing",
    desc: "ITR, AIS, advance tax challans",
    count: 15,
    icon: Shield,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    border: "hover:border-red-200",
  },
];

const recentUploads = [
  {
    name: "Form 16 - ABC Corp.pdf",
    type: "pdf",
    category: "Salary Documents",
    categoryStyle: "bg-indigo-50 text-indigo-700",
    fy: "2024-25",
    date: "2 May 2024",
    size: "1.2 MB",
  },
  {
    name: "Rent Receipt - Apr 2024.jpg",
    type: "image",
    category: "Rent & HRA",
    categoryStyle: "bg-orange-50 text-orange-700",
    fy: "2024-25",
    date: "1 May 2024",
    size: "845 KB",
  },
  {
    name: "ELSS Statement - Axis MF.pdf",
    type: "pdf",
    category: "Tax Saving Proofs",
    categoryStyle: "bg-emerald-50 text-emerald-700",
    fy: "2024-25",
    date: "28 Apr 2024",
    size: "520 KB",
  },
  {
    name: "Health Insurance - 80D.pdf",
    type: "pdf",
    category: "Tax Saving Proofs",
    categoryStyle: "bg-emerald-50 text-emerald-700",
    fy: "2024-25",
    date: "25 Apr 2024",
    size: "380 KB",
  },
  {
    name: "Capital Gains Statement.xlsx",
    type: "sheet",
    category: "Banking & Investments",
    categoryStyle: "bg-blue-50 text-blue-700",
    fy: "2024-25",
    date: "20 Apr 2024",
    size: "2.1 MB",
  },
];

const missingDocs = [
  { title: "Rent Receipts", period: "Apr – Jun 2024", icon: Home },
  { title: "NPS Contribution Proof", period: "FY 2024-25", icon: PiggyBank },
  { title: "Home Loan Interest Certificate", period: "FY 2024-25", icon: Landmark },
  { title: "Donation Receipt (80G)", period: "FY 2024-25", icon: FileText },
];

const aiInsights = [
  { text: "Your HRA exemption might be underutilized — upload rent receipts for Apr–Jun", icon: Home },
  { text: "Form 16 from ABC Corp is complete. Cross-check with AIS when available", icon: FileCheck },
  { text: "You have ₹62,000 unused 80C limit — upload ELSS/NPS proofs", icon: PiggyBank },
  { text: "3 documents expire soon — review before ITR filing", icon: AlertCircle },
];

const quickActions = [
  { label: "Upload Document", icon: Upload },
  { label: "Generate Tax Package", icon: Package },
  { label: "Share with CA", icon: Share2 },
  { label: "Download Document List", icon: Download },
  { label: "Document Vault Settings", icon: Settings },
];

const taxPackages = [
  {
    title: "Download Tax Package",
    desc: "All documents in ZIP",
    icon: Package,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    title: "Annual Tax Summary",
    desc: "PDF Report",
    icon: FileBarChart,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    title: "Form 16 (Consolidated)",
    desc: "View / Download",
    icon: FileText,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    title: "Investment Proof Summary",
    desc: "80C, 80D, 80G, NPS",
    icon: TrendingUp,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
];

function FileTypeIcon({ type }) {
  const styles = {
    pdf: "bg-red-50 text-red-600",
    image: "bg-purple-50 text-purple-600",
    sheet: "bg-emerald-50 text-emerald-600",
  };
  const labels = { pdf: "PDF", image: "IMG", sheet: "XLS" };

  return (
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${styles[type] || styles.pdf}`}
    >
      {labels[type] || "DOC"}
    </div>
  );
}

export default function DocumentsSection() {
  return (
    <div className="w-full max-w-[1500px] min-w-0">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
        <div className="shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-md">
            Securely store, organize and manage all your tax-related documents in one place.
          </p>
        </div>

        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:max-w-2xl lg:mx-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search documents..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto sm:shrink-0">
          <button
            type="button"
            suppressHydrationWarning
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            Upload Document
          </button>
          <button
            type="button"
            suppressHydrationWarning
            className="relative w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Bell size={18} className="text-gray-500" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
              RS
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">Rahul Sharma</p>
              <p className="text-xs text-gray-400">FY 2024-25</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {summaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  {stat.ring ? (
                    <div className="flex items-center gap-2 mt-2">
                      <ReadinessRing percent={78} />
                      <span className="text-xl font-bold text-gray-900">{stat.value}</span>
                    </div>
                  ) : (
                    <p
                      className={`font-bold text-gray-900 mt-1 ${stat.valueSize || "text-xl"} ${stat.valueColor || ""}`}
                    >
                      {stat.value}
                    </p>
                  )}
                  {stat.progress !== undefined && (
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${stat.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                {Icon && (
                  <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon size={16} className={stat.iconColor} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Smart Categories */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Smart Categories</h2>
          <a href="#" className="text-sm font-medium text-indigo-600 hover:underline flex items-center gap-1">
            View All Categories
            <ChevronRight size={16} />
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.title}
                className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm cursor-pointer transition-all hover:shadow-md ${cat.border}`}
              >
                <div className={`w-9 h-9 rounded-xl ${cat.iconBg} flex items-center justify-center mb-3`}>
                  <Icon size={18} className={cat.iconColor} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{cat.title}</h3>
                <p className="text-[11px] text-gray-500 mt-1 leading-snug line-clamp-2">{cat.desc}</p>
                <p className="text-xs font-semibold text-gray-400 mt-3">{cat.count} files</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_280px_260px] gap-5">
        {/* Left column: table + tax packages */}
        <div className="space-y-5 xl:col-span-1">
          {/* Recent Uploads */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-base font-semibold text-gray-900">Recent Uploads</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-50">
                    <th className="px-5 py-3 font-medium">Document Name</th>
                    <th className="px-3 py-3 font-medium">Category</th>
                    <th className="px-3 py-3 font-medium hidden md:table-cell">Financial Year</th>
                    <th className="px-3 py-3 font-medium hidden lg:table-cell">Uploaded On</th>
                    <th className="px-3 py-3 font-medium hidden sm:table-cell">Size</th>
                    <th className="px-5 py-3 font-medium w-10" />
                  </tr>
                </thead>
                <tbody>
                  {recentUploads.map((doc) => (
                    <tr
                      key={doc.name}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5 min-w-[180px]">
                          <FileTypeIcon type={doc.type} />
                          <span className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                            {doc.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-1 rounded-md whitespace-nowrap ${doc.categoryStyle}`}
                        >
                          {doc.category}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-gray-600 text-xs hidden md:table-cell">
                        {doc.fy}
                      </td>
                      <td className="px-3 py-3.5 text-gray-600 text-xs hidden lg:table-cell">
                        {doc.date}
                      </td>
                      <td className="px-3 py-3.5 text-gray-500 text-xs hidden sm:table-cell">
                        {doc.size}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          suppressHydrationWarning
                          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                          <MoreHorizontal size={16} className="text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-50 text-center">
              <a href="#" className="text-sm font-medium text-indigo-600 hover:underline">
                View All Documents
              </a>
            </div>
          </section>

          {/* Tax Package & Reports */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Tax Package &amp; Reports</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {taxPackages.map((pkg) => {
                const Icon = pkg.icon;
                return (
                  <div
                    key={pkg.title}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-xl ${pkg.iconBg} flex items-center justify-center mb-3`}>
                      <Icon size={18} className={pkg.iconColor} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{pkg.title}</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">{pkg.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Missing Documents */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Missing Documents</h2>
          <ul className="space-y-3">
            {missingDocs.map((doc) => {
              const Icon = doc.icon;
              return (
                <li
                  key={doc.title}
                  className="flex items-start gap-3 p-3 rounded-xl bg-red-50/40 border border-red-100/60"
                >
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 border border-red-100">
                    <Icon size={14} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{doc.period}</p>
                  </div>
                  <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded shrink-0">
                    Missing
                  </span>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            suppressHydrationWarning
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Upload size={16} className="text-gray-500" />
            Upload Missing Documents
          </button>
        </section>

        {/* Right sidebar */}
        <aside className="space-y-4 lg:col-span-2 xl:col-span-1">
          {/* AI Document Insights */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 flex-1">AI Document Insights</h3>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                New
              </span>
            </div>
            <ul className="space-y-3">
              {aiInsights.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={i} className="flex items-start gap-2">
                    <Icon size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 leading-relaxed">{item.text}</p>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              suppressHydrationWarning
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-indigo-200 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-50 transition-colors"
            >
              <MessageCircle size={16} />
              Ask AI Copilot
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <ul className="space-y-0.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <li key={action.label}>
                    <button
                      type="button"
                      suppressHydrationWarning
                      className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                    >
                      <Icon size={16} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 flex-1">{action.label}</span>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>

      {/* Footer security */}
      <footer className="flex flex-wrap items-center justify-center gap-6 py-8 mt-2 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <Lock size={14} />
          Your documents are encrypted and stored securely
        </span>
      </footer>
    </div>
  );
}
