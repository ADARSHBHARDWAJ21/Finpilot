import { createClient } from "@/lib/supabase/server-client";
import { detectBank, getSupportedBankLabels } from "@/lib/bank-parsers/detect-bank";
import { parseHDFC } from "@/lib/bank-parsers/parse-hdfc";
import { parseSBI } from "@/lib/bank-parsers/parse-sbi";
import { parseICICI } from "@/lib/bank-parsers/parse-icici";
import { parseCanara } from "@/lib/bank-parsers/parse-canara";
import { normalizeTransactions } from "@/lib/bank-parsers/normalize-transactions";
import { extractTextFromPdf } from "@/lib/bank-parsers/pdf-extract";

export const runtime = "nodejs";

const MIN_TEXT_LENGTH = 40;

export async function POST(req) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      return Response.json({ success: false, error: "No PDF file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const text = await extractTextFromPdf(buffer);

    if (text.trim().length < MIN_TEXT_LENGTH) {
      return Response.json({
        success: false,
        error:
          "Could not extract text from this PDF. It may be scanned or image-only — use CSV/Excel export instead.",
      });
    }

    const bank = detectBank(text);

    let parsed = [];

    switch (bank) {
      case "hdfc":
        parsed = parseHDFC(text);
        break;
      case "sbi":
        parsed = parseSBI(text);
        break;
      case "icici":
        parsed = parseICICI(text);
        break;
      case "canara":
        parsed = parseCanara(text);
        break;
      default:
        return Response.json({
          success: false,
          error: `Unsupported bank statement. Supported banks: ${getSupportedBankLabels()}.`,
        });
    }

    if (parsed.length === 0) {
      return Response.json({
        success: false,
        bank,
        error: `Detected ${bank.toUpperCase()} but found no transactions. Layout may have changed — try CSV/Excel.`,
      });
    }

    const normalized = normalizeTransactions(parsed);

    return Response.json({
      success: true,
      bank,
      transactions: normalized,
      count: normalized.length,
    });
  } catch (err) {
    console.error("parse-bank-pdf:", err);
    return Response.json({
      success: false,
      error: err.message || "Failed to parse PDF",
    });
  }
}
