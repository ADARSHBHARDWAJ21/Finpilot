import { extractTextFromFile } from "@/lib/ocr/extract-from-file";
import { extractTransactionsAI, splitByReviewThreshold } from "@/lib/ai/extract-transactions";
import { detectBank } from "@/lib/bank-parsers/detect-bank";
import { parseHDFC } from "@/lib/bank-parsers/parse-hdfc";
import { parseSBI } from "@/lib/bank-parsers/parse-sbi";
import { parseICICI } from "@/lib/bank-parsers/parse-icici";
import { parseCanara } from "@/lib/bank-parsers/parse-canara";
import { normalizeTransactions } from "@/lib/bank-parsers/normalize-transactions";
import { getSupportedBankLabels } from "@/lib/bank-parsers/detect-bank";

const PARSERS = {
  hdfc: parseHDFC,
  sbi: parseSBI,
  icici: parseICICI,
  canara: parseCanara,
};

const MIN_TEXT = 40;

function parseWithBankParser(text, method) {
  const bank = detectBank(text);
  if (bank === "unknown") return null;

  const parser = PARSERS[bank];
  const raw = parser(text);
  if (!raw.length) return null;

  const transactions = normalizeTransactions(raw).map((tx) => ({
    ...tx,
    confidence_score: method === "pdf-text" ? 95 : 75,
  }));

  return { bank, transactions, method: "bank-parser" };
}

/**
 * Upload → detect type → extract text → parse/AI → normalize → categorize (in normalize)
 */
export async function processStatement(buffer, fileType, mimeType = "") {
  const { text, method: extractionMethod } = await extractTextFromFile(
    buffer,
    fileType,
    mimeType
  );

  if (text.trim().length < MIN_TEXT) {
    return {
      ok: false,
      error:
        "Could not read enough text. Try a clearer photo, better lighting, or export CSV from your bank.",
    };
  }

  const bankParsed = parseWithBankParser(text, extractionMethod);
  if (bankParsed) {
    const { autoImport, needsReview } = splitByReviewThreshold(bankParsed.transactions);
    return {
      ok: true,
      bank: bankParsed.bank,
      transactions: bankParsed.transactions,
      autoImport,
      needsReview,
      extractionMethod: bankParsed.method || extractionMethod,
    };
  }

  const aiResult = await extractTransactionsAI(text, { extractionMethod });

  if (aiResult?.error && !aiResult?.transactions?.length) {
    return {
      ok: false,
      error: aiResult.error,
      warning: aiResult.warning || null,
    };
  }

  if (!aiResult?.transactions?.length) {
    return {
      ok: false,
      error: `No transactions found. Supported PDF banks: ${getSupportedBankLabels()}. Try CSV/Excel export.`,
      warning: aiResult?.warning || null,
    };
  }

  const { autoImport, needsReview } = splitByReviewThreshold(aiResult.transactions);

  return {
    ok: true,
    bank: aiResult.bank,
    transactions: aiResult.transactions,
    autoImport,
    needsReview,
    extractionMethod: aiResult.method || extractionMethod,
    warning: aiResult.warning || null,
  };
}
