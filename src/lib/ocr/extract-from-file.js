import { extractTextFromPdf } from "@/lib/bank-parsers/pdf-extract";
import { extractTextFromImage } from "@/lib/ocr/extract-text";
import { extractTextFromScannedPdf } from "@/lib/ocr/extract-scanned-pdf";
import { detectFileType } from "@/lib/file-detection";

const MIN_TEXT_PDF_CHARS = 40;

/**
 * Text PDF → pdf-parse. Scanned PDF / images → OCR.
 */
export async function extractTextFromFile(buffer, fileType, mimeType = "") {
  if (fileType === "image" || mimeType.includes("image")) {
    const text = await extractTextFromImage(buffer);
    return { text, method: "ocr-image" };
  }

  if (fileType === "pdf" || mimeType.includes("pdf")) {
    const pdfText = await extractTextFromPdf(buffer);

    if (pdfText.trim().length >= MIN_TEXT_PDF_CHARS) {
      return { text: pdfText, method: "pdf-text" };
    }

    const ocrText = await extractTextFromScannedPdf(buffer);
    return { text: ocrText, method: "ocr-pdf" };
  }

  throw new Error("Unsupported file type for text extraction");
}

export { detectFileType };
