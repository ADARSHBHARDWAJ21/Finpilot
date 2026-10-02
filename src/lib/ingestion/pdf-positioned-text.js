import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";

// Read original coordinates so digital statements do not depend on OCR accuracy.
export async function readPdfPositionedPages(buffer, { password = "", timed = (promise) => promise } = {}) {
  const loading = getDocument({ data: new Uint8Array(buffer), ...(password ? { password } : {}), verbosity: 0, isEvalSupported: false });
  let document;
  try {
    document = await timed(loading.promise);
    if (document.numPages > 20) throw new Error("This PDF has more than 20 pages. Split it into smaller PDFs so every page can be checked.");
    const pages = [];
    for (let num = 1; num <= document.numPages; num++) {
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
      const hasImages = operations.fnArray.some((operation) => [OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintImageMaskXObject].includes(operation));
      pages.push({ num, words, hasImages });
      page.cleanup();
    }
    return pages;
  } finally {
    if (document) await document.destroy().catch(() => {});
    else await loading.destroy().catch(() => {});
  }
}
