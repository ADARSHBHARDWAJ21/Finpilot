export const SUPPORTED_BANKS = [
  { id: "hdfc", label: "HDFC" },
  { id: "sbi", label: "SBI" },
  { id: "icici", label: "ICICI" },
  { id: "canara", label: "Canara Bank" },
];

export function detectBank(text) {
  const upper = String(text ?? "").toUpperCase();

  if (upper.includes("HDFC BANK")) {
    return "hdfc";
  }

  if (upper.includes("STATE BANK OF INDIA")) {
    return "sbi";
  }

  if (upper.includes("ICICI BANK")) {
    return "icici";
  }

  if (upper.includes("CANARA BANK")) {
    return "canara";
  }

  return "unknown";
}

export function getSupportedBankLabels() {
  return SUPPORTED_BANKS.map((b) => b.label).join(", ");
}
