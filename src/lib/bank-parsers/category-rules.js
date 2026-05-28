export const CATEGORY_RULES = [
  { keyword: "ZOMATO", category: "Food" },
  { keyword: "SWIGGY", category: "Food" },
  { keyword: "UBER", category: "Transport" },
  { keyword: "OLA", category: "Transport" },
  { keyword: "NETFLIX", category: "Entertainment" },
  { keyword: "AMAZON", category: "Shopping" },
  { keyword: "SALARY", category: "Income" },
];

export function detectCategory(desc = "") {
  const upper = String(desc).toUpperCase();

  for (const rule of CATEGORY_RULES) {
    if (upper.includes(rule.keyword)) {
      return rule.category;
    }
  }

  return "Other";
}

export function applyCategoryRules(description, existingCategory) {
  if (existingCategory && existingCategory !== "Other") {
    return existingCategory;
  }
  return detectCategory(description);
}
