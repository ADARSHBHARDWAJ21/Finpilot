import { createClient } from "@/lib/supabase/server-client";
import { preprocessImage } from "@/lib/ocr/preprocess-image";
import { extractTextFromImage } from "@/lib/ocr/extract-text";
import { extractTextFromFile } from "@/lib/ocr/extract-from-file";
import { detectFileType } from "@/lib/file-detection";

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileType = detectFileType(file);

    let text = "";
    let method = "ocr-image";

    if (fileType === "image") {
      const cleaned = await preprocessImage(buffer);
      text = await extractTextFromImage(cleaned);
    } else if (fileType === "pdf") {
      const extracted = await extractTextFromFile(buffer, "pdf", file.type || "");
      text = extracted.text;
      method = extracted.method;
    } else {
      return Response.json({
        success: false,
        error: "OCR supports images (PNG, JPG) and PDF files only",
      });
    }

    return Response.json({
      success: true,
      text,
      method,
    });
  } catch (err) {
    console.error("ocr-bank-statement:", err);
    return Response.json({
      success: false,
      error: err.message || "OCR failed",
    });
  }
}
