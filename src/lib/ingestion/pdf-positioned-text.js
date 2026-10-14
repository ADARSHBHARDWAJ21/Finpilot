import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import { MAX_PDF_PAGES, parseTransactionDate } from "../import/transaction-values.js";

const IDENTITY = [1, 0, 0, 1, 0, 0];
const validMatrix = (matrix) => matrix?.length === 6 && Array.from(matrix).every(Number.isFinite);

function multiply(left, right) {
  if (!validMatrix(left) || !validMatrix(right)) return null;
  const [a, b, c, d, e, f] = left;
  const [g, h, i, j, k, l] = right;
  return [a * g + c * h, b * g + d * h, a * i + c * j, b * i + d * j, a * k + c * l + e, b * k + d * l + f];
}

// Image coordinates share the 1,000-wide coordinate system used by native
// words. Checking the painted footprint avoids OCR for small bank logos while
// keeping scans, mixed pages and unknown image operations eligible for OCR.
export function getPdfImageCoverage(operations, viewport, words = []) {
  const imageRegions = [];
  const stack = [];
  let transform = IDENTITY;
  let hasImages = false;
  let unknownImage = false;
  const factor = 1000 / viewport.width;
  const pageHeight = viewport.height * factor;
  // A wide bank masthead is decorative when a native statement table begins
  // below it. Require real date/description/money headings and dated rows;
  // image-only tables and pictures in the transaction area still need OCR.
  const tableHeaders = words.filter((word) => /^date$/i.test(word.text)).filter((date) => {
    const line = words.filter((word) => Math.abs(word.y - date.y) <= Math.max(12, date.height * 1.5));
    const labels = line.map((word) => word.text.replace(/[^a-z]/gi, "").toLowerCase());
    return labels.some((label) => ["particulars", "description", "narration", "details"].includes(label)) && labels.filter((label) => ["deposits", "withdrawals", "debit", "credit", "balance", "amount"].includes(label)).length >= 2 && words.some((word) => word.y > date.y + date.height && parseTransactionDate(word.text));
  });
  const tableTop = tableHeaders.length ? Math.min(...tableHeaders.map((word) => word.y - word.height)) : null;
  function addImage(matrix = transform) {
    hasImages = true;
    if (!validMatrix(matrix)) { unknownImage = true; return; }
    const points = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => viewport.convertToViewportPoint(matrix[0] * x + matrix[2] * y + matrix[4], matrix[1] * x + matrix[3] * y + matrix[5])).map(([x, y]) => [x * factor, y * factor]);
    if (!points.flat().every(Number.isFinite)) { unknownImage = true; return; }
    const x = Math.max(0, Math.min(...points.map((point) => point[0])));
    const y = Math.max(0, Math.min(...points.map((point) => point[1])));
    const right = Math.min(1000, Math.max(...points.map((point) => point[0])));
    const bottom = Math.min(pageHeight, Math.max(...points.map((point) => point[1])));
    if (right > x && bottom > y) imageRegions.push({ x, y, width: right - x, height: bottom - y });
  }
  function repeatedImages(matrix, positions) {
    hasImages = true;
    if (!positions?.length || positions.length % 2 || !validMatrix(matrix)) { unknownImage = true; return; }
    for (let index = 0; index < positions.length; index += 2) addImage(multiply(transform, [...matrix.slice(0, 4), positions[index], positions[index + 1]]));
  }
  function groupedImages(images) {
    hasImages = true;
    if (!images?.length) { unknownImage = true; return; }
    for (const image of images) addImage(multiply(transform, image.transform));
  }
  for (let index = 0; index < operations.fnArray.length; index++) {
    const operation = operations.fnArray[index];
    const args = operations.argsArray?.[index] || [];
    if (operation === OPS.save) stack.push(transform);
    else if (operation === OPS.restore) transform = stack.pop() ?? null;
    else if (operation === OPS.transform) transform = multiply(transform, args);
    else if (operation === OPS.paintFormXObjectBegin) {
      stack.push(transform);
      const matrix = args[0];
      if (matrix) transform = multiply(transform, matrix);
    } else if (operation === OPS.beginGroup) {
      // PDF.js uses the group matrix for bounds only; the following form
      // operation applies it to the content. Applying both moves images twice.
      stack.push(transform);
    } else if (operation === OPS.paintFormXObjectEnd || operation === OPS.endGroup) transform = stack.pop() ?? null;
    else if (operation === OPS.beginAnnotation) { stack.push(transform); transform = null; }
    else if (operation === OPS.endAnnotation) transform = stack.pop() ?? null;
    else if ([OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintImageMaskXObject].includes(operation)) addImage();
    else if (operation === OPS.paintImageXObjectRepeat) repeatedImages([args[1], 0, 0, args[2], 0, 0], args[3]);
    else if (operation === OPS.paintImageMaskXObjectRepeat) repeatedImages([args[1], args[2], args[3], args[4], 0, 0], args[5]);
    else if (operation === OPS.paintImageMaskXObjectGroup) groupedImages(args[0]);
    else if (operation === OPS.paintInlineImageXObjectGroup) groupedImages(args[1]);
    else if ([OPS.paintXObject, OPS.beginInlineImage, OPS.beginImageData, OPS.endInlineImage].includes(operation)) { hasImages = true; unknownImage = true; }
  }
  const needsImageOcr = unknownImage || imageRegions.some((region) => {
    const inMargin = region.y + region.height <= pageHeight * 0.18 || region.y >= pageHeight * 0.9;
    const logoSized = region.width <= 280 && region.height <= pageHeight * 0.08 && region.width * region.height <= 1000 * pageHeight * 0.025;
    if (words.length && inMargin && logoSized) return false;
    if (tableTop !== null && region.y + region.height < tableTop - 10 && region.y + region.height <= pageHeight * 0.2 && region.height <= pageHeight * 0.18) return false;
    // Even a dense native text overlay may omit an image-only row. Every
    // substantial image must still be checked rather than inferring coverage.
    return true;
  });
  return { hasImages, imageRegions, needsImageOcr };
}

// Read original coordinates so digital statements do not depend on OCR accuracy.
export async function readPdfPositionedPages(buffer, { password = "", timed = (promise) => promise, pageNumbers = null } = {}) {
  const loading = getDocument({ data: new Uint8Array(buffer), ...(password ? { password } : {}), verbosity: 0, isEvalSupported: false });
  let document;
  try {
    document = await timed(loading.promise);
    if (document.numPages > MAX_PDF_PAGES) throw new Error(`This PDF has more than ${MAX_PDF_PAGES} pages. Choose a shorter statement.`);
    if (pageNumbers && (!pageNumbers.length || pageNumbers.some((num) => !Number.isInteger(num) || num < 1 || num > document.numPages))) throw new Error("Choose valid PDF pages to read.");
    const pages = [];
    const selectedPages = pageNumbers || Array.from({ length: document.numPages }, (_, index) => index + 1);
    for (const num of selectedPages) {
      const page = await timed(document.getPage(num));
      const viewport = page.getViewport({ scale: 1 });
      const factor = 1000 / viewport.width;
      const content = await timed(page.getTextContent());
      const words = [];
      for (const item of content.items) {
        if (!item.str?.trim() || !item.transform) continue;
        const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
        for (const match of item.str.matchAll(/\S+/g)) words.push({ text: match[0], x: (x + item.width * match.index / item.str.length) * factor, y: y * factor, width: item.width * match[0].length / item.str.length * factor, height: Math.max(item.height, 1) * factor });
      }
      const operations = await timed(page.getOperatorList());
      pages.push({ num, words, ...getPdfImageCoverage(operations, viewport, words) });
      page.cleanup();
    }
    return pages;
  } finally {
    if (document) await document.destroy().catch(() => {});
    else await loading.destroy().catch(() => {});
  }
}
