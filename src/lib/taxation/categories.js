import {
  Briefcase,
  PiggyBank,
  Home,
  Landmark,
  Shield,
} from "lucide-react";

export const TAX_CATEGORIES = [
  {
    slug: "salary-documents",
    title: "Salary Documents",
    desc: "Form 16, salary slips, employer proofs",
    icon: Briefcase,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    border: "hover:border-indigo-200",
    badgeBg: "bg-indigo-50 text-indigo-700",
    subtitle: "Capture salary structure and employer tax documents for accurate TDS and regime comparison.",
    checklist: [
      { id: "form16", label: "Form 16 (Part A & B)", hint: "Annual TDS certificate from employer" },
      { id: "salary_slips", label: "Salary Slips (Apr–Mar)", hint: "Monthly break-up of earnings" },
      { id: "offer_letter", label: "Offer / Revision Letter", hint: "CTC structure reference" },
      { id: "salary_profile", label: "Salary profile in FinCopilot", hint: "Synced CTC & components" },
    ],
  },
  {
    slug: "tax-saving-proofs",
    title: "Tax Saving Proofs",
    desc: "80C, 80D, NPS, ELSS certificates",
    icon: PiggyBank,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    border: "hover:border-emerald-200",
    badgeBg: "bg-emerald-50 text-emerald-700",
    subtitle: "Track Section 80C, 80D, and NPS proofs to maximize deductions under the old tax regime.",
    checklist: [
      { id: "80c", label: "Section 80C proofs", hint: "ELSS, PPF, EPF, LIC, FD" },
      { id: "80d", label: "Section 80D (health)", hint: "Self + parents insurance" },
      { id: "nps", label: "NPS (80CCD)", hint: "Additional ₹50,000 under 80CCD(1B)" },
      { id: "deductions_db", label: "Deductions saved in app", hint: "Linked to tax calculator" },
    ],
  },
  {
    slug: "rent-hra",
    title: "Rent & HRA",
    desc: "Rent receipts, lease agreements",
    icon: Home,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    border: "hover:border-orange-200",
    badgeBg: "bg-orange-50 text-orange-700",
    subtitle: "Validate HRA exemption with rent receipts and metro/non-metro rules.",
    checklist: [
      { id: "rent_receipts", label: "Rent receipts", hint: "Landlord PAN if rent > ₹1L/yr" },
      { id: "lease", label: "Rent agreement", hint: "Address & tenure match Form 16" },
      { id: "hra_declared", label: "HRA in salary structure", hint: "From Form 16 / payslip" },
      { id: "paying_rent", label: "Rent status in profile", hint: "Marked in onboarding" },
    ],
  },
  {
    slug: "banking-investments",
    title: "Banking & Investments",
    desc: "Statements, capital gains, FD proofs",
    icon: Landmark,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    border: "hover:border-blue-200",
    badgeBg: "bg-blue-50 text-blue-700",
    subtitle: "Investment proofs and bank statements for interest, capital gains, and other income.",
    checklist: [
      { id: "fd_interest", label: "FD / savings interest", hint: "Form 26AS / AIS" },
      { id: "capital_gains", label: "Capital gains statement", hint: "Broker / mutual fund" },
      { id: "demat", label: "Demat holding statement", hint: "Equity & MF holdings" },
      { id: "sip", label: "SIP / investment summary", hint: "From onboarding SIP amount" },
    ],
  },
  {
    slug: "compliance-filing",
    title: "Compliance & Filing",
    desc: "ITR, AIS, advance tax challans",
    icon: Shield,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    border: "hover:border-red-200",
    badgeBg: "bg-red-50 text-red-700",
    subtitle: "ITR readiness, regime recommendation, and filing checklist for FY 2024-25.",
    checklist: [
      { id: "ais", label: "AIS / TIS downloaded", hint: "Annual Information Statement" },
      { id: "regime", label: "Regime selected", hint: "Old vs new comparison done" },
      { id: "tax_paid", label: "Advance tax / TDS reconciled", hint: "Match challans & Form 26AS" },
      { id: "itr", label: "ITR filed / draft ready", hint: "e-Filing portal" },
    ],
  },
];

export function getCategoryBySlug(slug) {
  return TAX_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function getCategorySlugs() {
  return TAX_CATEGORIES.map((c) => c.slug);
}
