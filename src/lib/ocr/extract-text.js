import Tesseract from "tesseract.js";
import { preprocessImage } from "@/lib/ocr/preprocess-image";

export async function extractTextFromImage(imageBuffer) {
  const cleaned = await preprocessImage(imageBuffer);

  const result = await Tesseract.recognize(cleaned, "eng", {
    logger: () => {},
  });

  return result.data.text ?? "";
}
