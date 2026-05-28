export function detectFileType(file) {
  if (!file) return "unknown";

  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();

  if (type.includes("pdf") || name.endsWith(".pdf")) {
    return "pdf";
  }

  if (
    type.includes("image") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp")
  ) {
    return "image";
  }

  if (
    type.includes("csv") ||
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    name.endsWith(".csv") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls")
  ) {
    return "spreadsheet";
  }

  return "unknown";
}

export const SUPPORTED_UPLOAD_LABEL =
  "CSV, XLSX, text PDFs, scanned PDFs, PNG, JPG";
