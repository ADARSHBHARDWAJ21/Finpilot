import { createCanvas } from "canvas";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { extractTextFromImage } from "@/lib/ocr/extract-text";

const MAX_PAGES = 8;

export async function extractTextFromScannedPdf(pdfBuffer) {
  const data = new Uint8Array(pdfBuffer);
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

  const pageLimit = Math.min(doc.numPages, MAX_PAGES);
  const chunks = [];

  for (let pageNum = 1; pageNum <= pageLimit; pageNum++) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    await page.render({ canvasContext: context, viewport }).promise;

    const pngBuffer = canvas.toBuffer("image/png");
    const pageText = await extractTextFromImage(pngBuffer);
    chunks.push(pageText);
    page.cleanup();
  }

  return chunks.join("\n");
}
