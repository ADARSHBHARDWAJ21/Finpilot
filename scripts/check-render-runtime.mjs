// Fail the deployment build early when native PDF/image dependencies cannot load.
// This uses synthetic pixels, makes no provider calls, and writes no user files.
import { createCanvas } from "canvas";
import sharp from "sharp";
import { PDFParse } from "pdf-parse";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker } from "tesseract.js";

const canvas = createCanvas(2, 2);
const png = canvas.toBuffer("image/png");
await sharp(png).resize(1, 1).png().toBuffer();

if ([PDFParse, getDocument, createWorker].some((value) => typeof value !== "function")) {
  throw new Error("A required PDF/OCR runtime export is unavailable.");
}

console.log("PDF, image and OCR dependencies loaded successfully.");
