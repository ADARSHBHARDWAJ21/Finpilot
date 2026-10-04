export const CATEGORY_RULES = [
  { pattern: /(?:^|[^A-Z0-9])(?:SALARY|PAYROLL|PENSION|SBINT|INTEREST(?:\s+CREDIT)?)(?=$|[^A-Z0-9])/i, category: "Income" },
  { pattern: /(?:^|[^A-Z0-9])(?:NETFLIX|SPOTIFY|HOTSTAR|JIO\s*HOTSTAR|BOOKMYSHOW|PVR|INOX|AMAZON\s*PRIME|PRIME\s*VIDEO)(?=$|[^A-Z0-9])/i, category: "Entertainment" },
  { pattern: /(?:^|[^A-Z0-9])(?:ZOMATO|SWIGGY(?:\s*INSTAMART)?|BLINKIT|BIG\s*BASKET|ZEPTO|D\s*MART|DOMINOS|DOMINO'S|MCDONALDS|KFC|STARBUCKS|RESTAURANT|CAFE|COFFEE|GROCERY|GROCERIES)(?=$|[^A-Z0-9])/i, category: "Food" },
  { pattern: /(?:^|[^A-Z0-9])(?:UBER|OLA(?:\s*CABS)?|RAPIDO|IRCTC|METRO|PETROL|DIESEL|FUEL|FASTAG|TOLL|INDIAN\s*OIL|BHARAT\s*PETROLEUM|HPCL)(?=$|[^A-Z0-9])/i, category: "Transport" },
  { pattern: /(?:^|[^A-Z0-9])(?:AMAZON|FLIPKART|MYNTRA|AJIO|MEESHO|NYKAA|DECATHLON)(?=$|[^A-Z0-9])/i, category: "Shopping" },
  { pattern: /(?:^|[^A-Z0-9])(?:ELECTRICITY|ELECTRIC\s*BILL|WATER\s*BILL|BROADBAND|INTERNET\s*BILL|MOBILE\s*RECHARGE|AIRTEL|BSNL|JIO\s*(?:RECHARGE|FIBER)|BESCOM|MSEDCL|TANGEDCO|INDANE|BHARAT\s*GAS)(?=$|[^A-Z0-9])/i, category: "Utilities" },
  { pattern: /(?:^|[^A-Z0-9])(?:RENT|HOUSING|HOME\s*LOAN|MAINTENANCE\s*(?:CHARGES|FEE)|SOCIETY\s*(?:CHARGES|MAINTENANCE))(?=$|[^A-Z0-9])/i, category: "Housing" },
  { pattern: /(?:^|[^A-Z0-9])(?:HOSPITAL|PHARMACY|MEDICAL|MEDICINE|CLINIC|DIAGNOSTIC|APOLLO\s*PHARMACY|NETMEDS|PHARMEASY|TATA\s*1MG)(?=$|[^A-Z0-9])/i, category: "Healthcare" },
];

export function detectCategory(desc = "", type) {
  // A credit is money in even when its narration mentions a shop or a refund.
  if (type === "income") return "Income";
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(String(desc))) {
      if (rule.category === "Income" && type === "expense") return "Other";
      return rule.category;
    }
  }

  return "Other";
}

export function applyCategoryRules(description, existingCategory, type) {
  const category = String(existingCategory || "").trim();
  if (category && category.toLowerCase() !== "other") {
    return category;
  }
  return detectCategory(description, type);
}
