import { detectBank } from "@/lib/bank-parsers/detect-bank";
import { parseHDFC } from "@/lib/bank-parsers/parse-hdfc";
import { parseSBI } from "@/lib/bank-parsers/parse-sbi";
import { parseICICI } from "@/lib/bank-parsers/parse-icici";
import { parseCanara } from "@/lib/bank-parsers/parse-canara";
import { normalizeTransactions } from "@/lib/bank-parsers/normalize-transactions";
import { validateTransactions } from "@/lib/validators/transactions";

const PARSERS = {
  hdfc: parseHDFC,
  sbi: parseSBI,
  icici: parseICICI,
  canara: parseCanara,
};

const REVIEW_THRESHOLD = 70;

/** Models that work with v1beta generateContent (1.5-flash often returns 404 on new keys) */
const GEMINI_MODEL_FALLBACKS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-preview-05-20",
];

function parseJsonFromContent(content) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText);
}

function tryBankParser(text, confidenceScore) {
  const bank = detectBank(text);
  if (bank === "unknown") return null;

  const parser = PARSERS[bank];
  if (!parser) return null;

  const raw = parser(text);
  if (!raw.length) return null;

  const normalized = normalizeTransactions(raw);

  return {
    bank,
    transactions: normalized.map((tx) => ({
      ...tx,
      confidence_score: confidenceScore,
    })),
    method: "bank-parser",
  };
}

function fallbackRegexExtract(text) {
  const bankResult = tryBankParser(text, 60);
  if (bankResult) return bankResult;

  const lines = text.split(/\r?\n/);
  const loose = [];

  const patterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.*?)\s+([-]?[\d,]+\.\d{2})/,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.*?)\s+([-]?[\d,]+)/,
    /(\d{2}-\d{2}-\d{4})\s+(.*?)\s+([-]?[\d,]+\.\d{2})/,
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 8) continue;

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (!match) continue;

      const amount = Number(String(match[3]).replace(/,/g, ""));
      if (!Number.isFinite(amount) || amount === 0) continue;

      loose.push({
        date: match[1],
        description: match[2].trim() || "Transaction",
        amount,
      });
      break;
    }
  }

  if (!loose.length) return null;

  const normalized = normalizeTransactions(loose);
  return {
    bank: detectBank(text) !== "unknown" ? detectBank(text) : null,
    transactions: normalized.map((tx) => ({
      ...tx,
      confidence_score: 55,
    })),
    method: "regex-fallback",
  };
}

function parseGeminiErrorResponse(errText, status) {
  try {
    const json = JSON.parse(errText);
    return {
      status,
      message: json.error?.message || errText,
      code: json.error?.code || status,
    };
  } catch {
    return { status, message: errText, code: status };
  }
}

async function callGeminiModel(text, model) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: { status: 0, message: "GEMINI_API_KEY is not set" } };
  }

  const prompt = `You extract bank transactions from statements. Output ONLY a valid JSON array. Do not invent rows.

Each item:
{"date":"DD/MM/YYYY or YYYY-MM-DD","description":"text","amount":number}

Negative amount = debit/expense. Positive = credit/income.

Statement:
${text.slice(0, 12000)}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    }),
  });

  const errText = await response.text();

  if (!response.ok) {
    return { ok: false, error: parseGeminiErrorResponse(errText, response.status) };
  }

  let payload;
  try {
    payload = JSON.parse(errText);
  } catch {
    return { ok: false, error: { status: 500, message: "Invalid Gemini response" } };
  }

  const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    return { ok: false, error: { status: 500, message: "Gemini returned empty content" } };
  }

  return { ok: true, content, model };
}

/**
 * Returns extracted text or null if all models fail (never throws).
 */
async function extractWithGemini(text) {
  const primary = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const models = [primary, ...GEMINI_MODEL_FALLBACKS].filter(
    (m, i, arr) => arr.indexOf(m) === i
  );

  let lastError = null;

  for (const model of models) {
    const result = await callGeminiModel(text, model);
    if (result.ok) return result.content;

    lastError = result.error;
    console.warn(
      `[Gemini] ${model} failed (${result.error.status}):`,
      result.error.message?.slice(0, 120)
    );

    if (result.error.status === 401 || result.error.status === 403) {
      break;
    }
  }

  return { content: null, lastError };
}

function buildGeminiWarning(lastError) {
  if (!lastError) return "Gemini unavailable — used local parser.";
  if (lastError.status === 429) {
    return "Gemini quota exceeded — used local parser. Review rows or use CSV/Excel.";
  }
  if (lastError.status === 404) {
    return "Gemini model unavailable — used local parser.";
  }
  return "Gemini skipped — used local parser.";
}

export async function extractTransactionsAI(text, options = {}) {
  const extractionMethod = options.extractionMethod || "ocr";
  const parserConfidence =
    extractionMethod === "pdf-text" ? 95 : extractionMethod === "ocr-pdf" ? 75 : 68;

  const bankParsed = tryBankParser(text, parserConfidence);
  if (bankParsed) {
    return bankParsed;
  }

  const fallbackOnly = () => {
    const fallback = fallbackRegexExtract(text);
    if (fallback) {
      return {
        ...fallback,
        warning: buildGeminiWarning(null),
      };
    }
    return null;
  };

  if (!process.env.GEMINI_API_KEY?.trim()) {
    return fallbackOnly();
  }

  const { content, lastError } = await extractWithGemini(text);

  if (!content) {
    const fallback = fallbackRegexExtract(text);
    if (fallback) {
      return { ...fallback, warning: buildGeminiWarning(lastError) };
    }

    return {
      bank: null,
      transactions: [],
      method: "failed",
      error:
        lastError?.status === 429
          ? "Gemini quota exceeded and local parser found no rows. Use CSV/Excel or wait for quota reset."
          : "Could not extract transactions. Use CSV/Excel, a text PDF, or a clearer photo.",
      warning: buildGeminiWarning(lastError),
    };
  }

  let parsed;
  try {
    parsed = parseJsonFromContent(content);
  } catch {
    const fallback = fallbackRegexExtract(text);
    if (fallback) {
      return { ...fallback, warning: "Gemini JSON invalid — used local parser." };
    }
    return {
      bank: null,
      transactions: [],
      method: "failed",
      error: "Could not parse transactions from statement.",
    };
  }

  const validated = validateTransactions(parsed);
  if (!validated.length) {
    const fallback = fallbackRegexExtract(text);
    if (fallback) return fallback;
    return {
      bank: null,
      transactions: [],
      method: "failed",
      error: "No valid transactions found in statement.",
    };
  }

  const normalized = normalizeTransactions(validated);
  const aiConfidence = extractionMethod === "pdf-text" ? 88 : 72;

  return {
    bank: detectBank(text) !== "unknown" ? detectBank(text) : null,
    transactions: normalized.map((tx) => ({
      ...tx,
      confidence_score: aiConfidence,
    })),
    method: "gemini-extraction",
  };
}

export function splitByReviewThreshold(transactions, threshold = REVIEW_THRESHOLD) {
  const autoImport = [];
  const needsReview = [];

  for (const tx of transactions) {
    const score = tx.confidence_score ?? 0;
    if (score < threshold) {
      needsReview.push(tx);
    } else {
      autoImport.push(tx);
    }
  }

  return { autoImport, needsReview, threshold: REVIEW_THRESHOLD };
}

export { REVIEW_THRESHOLD };
