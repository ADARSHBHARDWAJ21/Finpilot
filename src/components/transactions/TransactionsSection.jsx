"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  FileText,
  Check,
  Sparkles,
} from "lucide-react";

const transactions = [
  {
    date: "17 May 2025",
    name: "Netflix Subscription",
    sub: "Entertainment",
    icon: "N",
    iconBg: "bg-red-600",
    category: "Entertainment",
    categoryStyle: "bg-red-50 text-red-600",
    payment: "HDFC Credit Card",
    paymentSub: "**** 1234",
    paymentIcon: "💳",
    amount: "-₹649",
    income: false,
    status: "Completed",
  },
  {
    date: "17 May 2025",
    name: "Zomato Order",
    sub: "Food & Dining",
    icon: "Z",
    iconBg: "bg-red-500",
    category: "Food",
    categoryStyle: "bg-orange-50 text-orange-600",
    payment: "Google Pay UPI",
    paymentSub: "aryan@okhdfc",
    paymentIcon: "📱",
    amount: "-₹485",
    income: false,
    status: "Completed",
  },
  {
    date: "16 May 2025",
    name: "Amazon Purchase",
    sub: "Shopping",
    icon: "a",
    iconBg: "bg-orange-400",
    category: "Shopping",
    categoryStyle: "bg-purple-50 text-purple-600",
    payment: "HDFC Credit Card",
    paymentSub: "**** 1234",
    paymentIcon: "💳",
    amount: "-₹2,499",
    income: false,
    status: "Completed",
  },
  {
    date: "15 May 2025",
    name: "Salary Credit",
    sub: "Income",
    icon: "H",
    iconBg: "bg-blue-700",
    category: "Income",
    categoryStyle: "bg-emerald-50 text-emerald-600",
    payment: "HDFC Bank",
    paymentSub: "**** 5678",
    paymentIcon: "🏦",
    amount: "+₹1,28,500",
    income: true,
    status: "Completed",
  },
  {
    date: "15 May 2025",
    name: "Uber Ride",
    sub: "Transport",
    icon: "U",
    iconBg: "bg-gray-900",
    category: "Transport",
    categoryStyle: "bg-blue-50 text-blue-600",
    payment: "Paytm UPI",
    paymentSub: "aryan@paytm",
    paymentIcon: "📱",
    amount: "-₹245",
    income: false,
    status: "Completed",
  },
  {
    date: "14 May 2025",
    name: "Electricity Bill",
    sub: "Utilities",
    icon: "⚡",
    iconBg: "bg-amber-400",
    category: "Utilities",
    categoryStyle: "bg-violet-50 text-violet-600",
    payment: "Auto Debit",
    paymentSub: "HDFC **** 5678",
    paymentIcon: "🏦",
    amount: "-₹1,840",
    income: false,
    status: "Completed",
  },
  {
    date: "13 May 2025",
    name: "Swiggy Order",
    sub: "Food & Dining",
    icon: "S",
    iconBg: "bg-orange-500",
    category: "Food",
    categoryStyle: "bg-orange-50 text-orange-600",
    payment: "PhonePe UPI",
    paymentSub: "aryan@ybl",
    paymentIcon: "📱",
    amount: "-₹320",
    income: false,
    status: "Completed",
  },
];

const uploadBenefits = [
  "Automatically fetch and categorize transactions",
  "Save time with AI-powered reconciliation",
  "More accurate insights and reports",
];

export default function TransactionsSection() {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-5 overflow-hidden">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pt-6 pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Transactions</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            View, manage and import your transactions
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            suppressHydrationWarning
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            All Categories
            <ChevronDown size={16} className="text-gray-400" />
          </button>
          <a
            href="#"
            className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            View All
          </a>
        </div>
      </div>

      {/* Upload bank statement */}
      <div className="mx-6 mb-6 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-5">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <CloudUpload size={22} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Upload Bank Statement</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Drag and drop your file here or click to browse
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Supports PDF and CSV files</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 ml-14">
              <button
                type="button"
                suppressHydrationWarning
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-600 bg-white border border-gray-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
              >
                <FileText size={14} />
                Choose PDF File
              </button>
              <button
                type="button"
                suppressHydrationWarning
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-600 bg-white border border-gray-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
              >
                <FileText size={14} />
                Choose CSV File
              </button>
            </div>
          </div>

          <div className="lg:w-[340px] lg:border-l lg:border-indigo-100 lg:pl-6">
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles size={14} className="text-indigo-600" />
              <h4 className="text-sm font-semibold text-indigo-700">Why upload bank statement?</h4>
            </div>
            <ul className="space-y-2">
              {uploadBenefits.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
                  <Check size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
              Supported formats: PDF (.pdf) and CSV (.csv). File size up to 10MB.
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-y border-gray-100 bg-gray-50/50">
              {["Date", "Description", "Category", "Payment Method", "Amount", "Status"].map((col) => (
                <th
                  key={col}
                  className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, i) => (
              <tr
                key={i}
                className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{tx.date}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full ${tx.iconBg} flex items-center justify-center text-white text-sm font-bold shrink-0`}
                    >
                      {tx.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{tx.name}</p>
                      <p className="text-xs text-gray-400">{tx.sub}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${tx.categoryStyle}`}
                  >
                    {tx.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{tx.paymentIcon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{tx.payment}</p>
                      <p className="text-xs text-gray-400">{tx.paymentSub}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-sm font-bold whitespace-nowrap ${
                      tx.income ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {tx.amount}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100">
        <p className="text-sm text-gray-500">Showing 1 to 7 of 25 transactions</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            suppressHydrationWarning
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          {[1, 2, 3, 4].map((page) => (
            <button
              key={page}
              type="button"
              suppressHydrationWarning
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                page === 1
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}
          <span className="px-1 text-gray-400 text-sm">…</span>
          <button
            type="button"
            suppressHydrationWarning
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            7
          </button>
          <button
            type="button"
            suppressHydrationWarning
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
