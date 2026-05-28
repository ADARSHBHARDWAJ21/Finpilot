const CATEGORY_STYLES = {
  Entertainment: "bg-red-50 text-red-600",
  Food: "bg-orange-50 text-orange-600",
  "Food & Dining": "bg-orange-50 text-orange-600",
  Shopping: "bg-purple-50 text-purple-600",
  Income: "bg-emerald-50 text-emerald-600",
  Transport: "bg-blue-50 text-blue-600",
  Utilities: "bg-violet-50 text-violet-600",
  Other: "bg-gray-100 text-gray-600",
};

const ICON_COLORS = [
  "bg-red-600",
  "bg-red-500",
  "bg-orange-400",
  "bg-blue-700",
  "bg-gray-900",
  "bg-amber-400",
  "bg-orange-500",
  "bg-purple-600",
  "bg-emerald-600",
];

export function getCategoryStyle(category) {
  return CATEGORY_STYLES[category] || "bg-gray-100 text-gray-600";
}

export function formatTransactionDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatAmount(amount, type) {
  const value = Number(amount) || 0;
  const signed = type === "income" ? value : -value;
  const prefix = signed >= 0 ? "+" : "-";
  return `${prefix}₹${Math.abs(signed).toLocaleString("en-IN")}`;
}

export function mapTransactionToRow(tx, index = 0) {
  const description = tx.description || "Transaction";
  const initial = description.charAt(0).toUpperCase() || "?";

  return {
    id: tx.id,
    date: formatTransactionDate(tx.transaction_date),
    name: description,
    sub: tx.category || "Other",
    icon: initial,
    iconBg: ICON_COLORS[index % ICON_COLORS.length],
    category: tx.category || "Other",
    categoryStyle: getCategoryStyle(tx.category),
    payment: tx.payment_method || "Unknown",
    paymentSub: "",
    paymentIcon: tx.payment_method?.toLowerCase().includes("upi") ? "📱" : "💳",
    amount: formatAmount(tx.amount, tx.type),
    income: tx.type === "income",
    status:
      tx.review_status === "needs_review"
        ? "Needs Review"
        : "Completed",
    statusStyle:
      tx.review_status === "needs_review"
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700",
    confidenceScore: tx.confidence_score,
  };
}
