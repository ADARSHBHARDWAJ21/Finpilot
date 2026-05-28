/** Serializable category metadata (safe for Server → Client props). */

export const CATEGORY_DISPLAY = {
  Housing: {
    label: "Housing",
    iconKey: "home",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  Food: {
    label: "Food & Dining",
    iconKey: "utensils",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  "Food & Dining": {
    label: "Food & Dining",
    iconKey: "utensils",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  Transport: {
    label: "Transport",
    iconKey: "car",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  Shopping: {
    label: "Shopping",
    iconKey: "shopping-bag",
    iconBg: "bg-pink-50",
    iconColor: "text-pink-600",
  },
  Entertainment: {
    label: "Entertainment",
    iconKey: "film",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  Utilities: {
    label: "Utilities",
    iconKey: "zap",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  Healthcare: {
    label: "Healthcare",
    iconKey: "heart",
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
  Income: {
    label: "Income",
    iconKey: "trending-up",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  Other: {
    label: "Others",
    iconKey: "more-horizontal",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
  },
};

export const DEFAULT_CATEGORY_KEYS = [
  "Housing",
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Utilities",
  "Healthcare",
  "Other",
];

export function normalizeCategoryName(category) {
  const raw = String(category || "Other").trim();
  const map = {
    "Food & Dining": "Food",
    DEPOSIT: "Other",
    WITHDRAWAL: "Other",
    INTEREST: "Income",
  };
  return map[raw] || raw;
}

export function getCategoryMeta(category) {
  const key = normalizeCategoryName(category);
  return (
    CATEGORY_DISPLAY[key] || {
      label: key,
      iconKey: "more-horizontal",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
    }
  );
}
