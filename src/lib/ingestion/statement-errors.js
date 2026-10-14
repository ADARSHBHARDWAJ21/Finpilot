export const STATEMENT_TIMEOUT_MESSAGE = "Processing took too long. Try a clearer scan, split the PDF into fewer pages, or use your bank's CSV/Excel export.";
export const OCR_UNAVAILABLE_MESSAGE = "Text recognition is temporarily unavailable. Please try again or use a CSV/Excel export from your bank.";

const GENERIC_STATEMENT_ERROR = "Could not read this file. Try a clearer image or a new CSV/Excel/PDF export from your bank.";
const SAFE_STATEMENT_ERROR = /^(?:Choose |File is too large|This PDF |This statement |This workbook |No readable |Could not read a PDF|This PDF needs)/;

export function createStatementTimeout() {
  const error = new Error(STATEMENT_TIMEOUT_MESSAGE);
  error.code = "STATEMENT_TIMEOUT";
  error.status = 504;
  return error;
}

export function statementErrorResponse(error) {
  const message = typeof error?.message === "string" ? error.message : "";
  if (error?.code === "FILE_TOO_LARGE" || message.startsWith("File is too large")) return { status: 413, body: { success: false, error: message, code: "FILE_TOO_LARGE" } };
  if (error?.code === "STATEMENT_TIMEOUT" || message.startsWith("Processing took too long")) {
    return { status: 504, body: { success: false, error: STATEMENT_TIMEOUT_MESSAGE, code: "STATEMENT_TIMEOUT" } };
  }
  if (error?.code === "OCR_UNAVAILABLE") return { status: 503, body: { success: false, error: OCR_UNAVAILABLE_MESSAGE, code: "OCR_UNAVAILABLE" } };
  if (error?.code === "PDF_PASSWORD_REQUIRED") {
    return { status: 422, body: { success: false, error: SAFE_STATEMENT_ERROR.test(message) ? message : "This PDF needs its password. Enter the bank statement password and try again.", code: "PDF_PASSWORD_REQUIRED" } };
  }
  if (SAFE_STATEMENT_ERROR.test(message)) return { status: 422, body: { success: false, error: message } };
  return { status: 500, body: { success: false, error: GENERIC_STATEMENT_ERROR } };
}
