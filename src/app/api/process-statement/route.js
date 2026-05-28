import { createClient } from "@/lib/supabase/server-client";
import { detectFileType } from "@/lib/file-detection";
import { processStatement } from "@/lib/ingestion/process-statement";

export const runtime = "nodejs";

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
      return Response.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const fileType = detectFileType(file);

    if (fileType !== "pdf" && fileType !== "image") {
      return Response.json({
        success: false,
        error: "Use CSV/Excel upload for spreadsheet files",
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await processStatement(buffer, fileType, file.type || "");

    if (!result.ok) {
      return Response.json({ success: false, error: result.error });
    }

    return Response.json({
      success: true,
      bank: result.bank,
      transactions: result.transactions,
      autoImport: result.autoImport,
      needsReview: result.needsReview,
      extractionMethod: result.extractionMethod,
      count: result.transactions.length,
      reviewCount: result.needsReview.length,
      warning: result.warning || null,
    });
  } catch (err) {
    console.error("process-statement:", err);
    return Response.json({
      success: false,
      error: err.message || "Failed to process statement",
    });
  }
}
