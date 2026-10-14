import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";
import sharp from "sharp";
import path from "node:path";
import { access } from "node:fs/promises";
import { parseStatementText, parseStatementMatrix, completeStatementRows, countStatementDateRows } from "../import/statement-parser.js";
import { parseOcrStatementLayout, parsePositionedStatementLayout } from "../import/ocr-layout-parser.js";
import { validateImportRow, parseTransactionDate, MAX_PDF_PAGES, assertImportRowLimit } from "../import/transaction-values.js";
import { readPdfPositionedPages } from "./pdf-positioned-text.js";
import { createStatementTimeout, OCR_UNAVAILABLE_MESSAGE } from "./statement-errors.js";

const MAX_RUNTIME_MS = 150_000;
const readable = (value) => value?.transactions?.filter((row) => !validateImportRow(row).issues.length).length || 0;

export function selectStatementExtraction(candidates) {
  return candidates.filter(Boolean).map((value, index) => ({ value, index, valid: readable(value), fields: value.transactions.reduce((sum, row) => sum + 4 - validateImportRow(row).issues.length, 0) })).sort((a, b) => b.valid - a.valid || b.value.transactions.length - a.value.transactions.length || b.fields - a.fields || a.index - b.index)[0]?.value || { transactions: [], warnings: [] };
}

function informationalPage(text, page) {
  if (!text.trim() || page?.needsImageOcr || countStatementDateRows(text) || page?.words.some((word) => parseTransactionDate(word.text))) return false;
  return /^(?:disclaimer|terms\s*(?:and|&)\s*conditions|important\s*(?:information|notice)|privacy\s*notice)\b/i.test(text.trim()) || /\bend\s+of\s+statement\b/i.test(text);
}

export async function processStatement(buffer, fileType, mimeType = "", { password = "", deferOcr = false, pageNumbers = null, forceOcr = false, initialLayout = null, includeBalances = false, allowEmpty = false } = {}) {
  const deadline = Date.now() + MAX_RUNTIME_MS;
  let worker;
  let parser;
  const warnings = [];
  const remaining = () => {
    const time = deadline - Date.now();
    if (time <= 0) throw createStatementTimeout();
    return time;
  };
  async function timed(promise) {
    let timer;
    try {
      return await Promise.race([promise, new Promise((_, reject) => {
        timer = setTimeout(() => reject(createStatementTimeout()), remaining());
      })]);
    } finally { clearTimeout(timer); }
  }
  async function recognize(image, { layout: previousLayout = null, expectedRows = 0 } = {}) {
    if (!worker) {
      // Ship the language model with the app. A cold upload must not wait for
      // a CDN download (or depend on an ephemeral host's OCR cache).
      const langPath = process.cwd();
      try { await timed(access(path.join(langPath, "eng.traineddata"))); }
      catch (error) {
        if (error.code === "STATEMENT_TIMEOUT") throw error;
        throw Object.assign(new Error(OCR_UNAVAILABLE_MESSAGE), { code: "OCR_UNAVAILABLE" });
      }
      const creating = createWorker("eng", 1, { langPath, gzip: false, cacheMethod: "none", logger: () => {}, errorHandler: () => {} });
      try { worker = await timed(creating); }
      catch (error) {
        creating.then((lateWorker) => lateWorker.terminate()).catch(() => {});
        if (error.code === "STATEMENT_TIMEOUT") throw error;
        throw Object.assign(new Error(OCR_UNAVAILABLE_MESSAGE), { code: "OCR_UNAVAILABLE" });
      }
    }
    const imageData = await timed(sharp(image, { limitInputPixels: 40_000_000 }).rotate().flatten({ background: "white" }).resize({ width: 2200, withoutEnlargement: false }).grayscale().normalize().sharpen().png().toBuffer());
    const candidates = [];
    let dateRows = expectedRows;
    let nextLayout = previousLayout;
    for (const mode of ["6", "11"]) {
      await timed(worker.setParameters({ preserve_interword_spaces: "1", tessedit_pageseg_mode: mode }));
      const result = await timed(worker.recognize(imageData, {}, { text: true, tsv: true }));
      const text = result.data.text || "";
      dateRows = Math.max(dateRows, countStatementDateRows(text));
      let layout;
      try { layout = parseOcrStatementLayout(result.data.tsv, { layout: previousLayout, includeBalances: true }); }
      catch (error) { if (error.code === "IMPORT_ROW_LIMIT") throw error; }
      if (layout?.layout) nextLayout = layout.layout;
      candidates.push(layout, parseStatementText(text, { includeBalances: true }));
      const best = selectStatementExtraction(candidates);
      if (best.transactions.length && readable(best) === best.transactions.length && best.transactions.length >= dateRows) break;
    }
    return { ...selectStatementExtraction(candidates), dateRows, layout: nextLayout };
  }
  try {
    let transactions = [];
    let openingBalance = null;
    let extractionMethod = "Photo text recognition";
    let totalPages = 1;
    let ocrLayout = initialLayout;
    const pendingPages = [];
    const pageResults = [];
    if (fileType === "image") {
      const image = await recognize(buffer);
      transactions = image.transactions;
      openingBalance = image.openingBalance;
      if (image.dateRows > transactions.length) warnings.push(`The image contains at least ${image.dateRows} dated rows, but only ${transactions.length} were read. Upload a clearer image or a CSV/Excel export to recover the remaining rows.`);
    } else if (fileType === "pdf") {
      parser = new PDFParse({ data: buffer, ...(password ? { password } : {}) });
      const info = await timed(parser.getInfo());
      totalPages = info.total;
      if (info.total > MAX_PDF_PAGES) throw new Error(`This PDF has more than ${MAX_PDF_PAGES} pages. Choose a shorter statement.`);
      if (pageNumbers && (!pageNumbers.length || pageNumbers.some((num) => !Number.isInteger(num) || num < 1 || num > info.total))) throw new Error("Choose valid PDF pages to read.");
      // Neighboring native pages retain a row's narration or amount when a
      // requested OCR page ends in the middle of that transaction.
      const contextPages = forceOcr && pageNumbers ? [...new Set(pageNumbers.flatMap((num) => [num - 1, num, num + 1]).filter((num) => num >= 1 && num <= info.total))].sort((a, b) => a - b) : pageNumbers;
      const extracted = await timed(parser.getText({ cellSeparator: "\t", pageJoiner: "", ...(contextPages ? { partial: contextPages } : {}) }));
      const positionedPages = await readPdfPositionedPages(buffer, { password, timed, pageNumbers: contextPages });
      const informationPages = new Set(extracted.pages.filter((page) => informationalPage(page.text, positionedPages.find((original) => original.num === page.num))).map((page) => page.num));
      let documentLayout;
      let offset = 0;
      const documentWords = positionedPages.filter((page) => !informationPages.has(page.num)).flatMap((page) => {
        const words = page.words.map((word) => ({ ...word, y: word.y + offset, sourcePage: page.num }));
        offset += page.words.reduce((maximum, word) => Math.max(maximum, word.y), 0) + 100;
        return words;
      });
      try { documentLayout = parsePositionedStatementLayout(documentWords, { layout: initialLayout, includeBalances: true, includeSourcePages: true }); }
      catch (error) { if (error.code === "IMPORT_ROW_LIMIT") throw error; }
      let scannedCount = 0;
      let nativeLayout = initialLayout;
      const emptyPages = [];
      for (const page of extracted.pages.filter((page) => !pageNumbers || pageNumbers.includes(page.num))) {
        remaining();
        if (informationPages.has(page.num) && !forceOcr) {
          pageResults.push({ num: page.num, transactions: [], expectedRows: 0, needsOcr: false, informational: true });
          continue;
        }
        const plain = parseStatementText(page.text, { includeBalances: true });
        const original = positionedPages.find((entry) => entry.num === page.num);
        let positioned;
        try { positioned = parsePositionedStatementLayout(original?.words || [], { layout: nativeLayout, includeBalances: true }); }
        catch (error) { if (error.code === "IMPORT_ROW_LIMIT") throw error; }
        if (positioned?.layout) nativeLayout = positioned.layout;
        const fromDocument = documentLayout ? { transactions: documentLayout.transactions.filter((row) => row._sourcePage === page.num), openingBalance: documentLayout.openingBalance } : null;
        const candidates = [fromDocument, positioned, plain];
        let selected = selectStatementExtraction(candidates);
        let expectedRows = countStatementDateRows(page.text);
        const complete = () => selected.transactions.length > 0 && readable(selected) === selected.transactions.length && selected.transactions.length >= expectedRows;
        // Grid detection is a fallback, not a mandatory extra document scan.
        // Scans without native dated rows have no table text to extract.
        if (!forceOcr && !complete() && (selected.transactions.length || expectedRows)) {
          let tables;
          try { tables = await timed(parser.getTable({ partial: [page.num] })); }
          catch (error) { remaining(); if (error.code === "STATEMENT_TIMEOUT") throw error; }
          const tableCandidates = [];
          for (const table of tables?.pages.find((entry) => entry.num === page.num)?.tables || []) {
            try { tableCandidates.push(...parseStatementMatrix(table, { includeBalances: true }).transactions); }
            catch (error) { if (error.code === "IMPORT_ROW_LIMIT") throw error; }
          }
          candidates.push({ transactions: tableCandidates, warnings: [] });
          selected = selectStatementExtraction(candidates);
        }
        // A page may contain readable text AND scanned rows. Existing valid
        // rows alone are not proof that the whole page has been read. Small
        // header/footer logos, however, do not contain transaction tables.
        const needsOcr = forceOcr || !!original?.needsImageOcr || !complete();
        if (needsOcr && deferOcr) pendingPages.push(page.num);
        else if (needsOcr) {
          const images = await timed(parser.getScreenshot({ partial: [page.num], desiredWidth: 2000, imageDataUrl: false, imageBuffer: true }));
          if (!images.pages[0]?.data) throw new Error("Could not read a PDF page. Try a new bank export.");
          const image = await recognize(images.pages[0].data, { layout: ocrLayout || nativeLayout, expectedRows });
          if (image.layout) ocrLayout = image.layout;
          expectedRows = Math.max(expectedRows, image.dateRows);
          candidates.push(image);
          selected = selectStatementExtraction(candidates);
          scannedCount++;
        }
        openingBalance ??= selected.openingBalance ?? null;
        transactions.push(...selected.transactions);
        pageResults.push({ num: page.num, transactions: selected.transactions, expectedRows, openingBalance: selected.openingBalance ?? null, needsOcr, layout: nativeLayout });
        if (!(needsOcr && deferOcr)) {
          if (!selected.transactions.length) emptyPages.push(page.num);
          else if (selected.transactions.length < expectedRows) warnings.push(`PDF page ${page.num}: at least ${expectedRows} dated rows were detected, but only ${selected.transactions.length} were read. Check this page against the preview; a clearer bank export can recover the missing rows.`);
        }
        assertImportRowLimit(transactions.length);
      }
      extractionMethod = scannedCount ? "PDF with text recognition" : "PDF text";
      if (scannedCount) warnings.push(`${scannedCount} PDF page(s) used text recognition. Please check every extracted row.`);
      if (emptyPages.length) warnings.push(`No transaction rows were found on PDF page(s) ${emptyPages.join(", ")}. Check whether those pages contain transactions before importing.`);
    } else throw new Error("Choose a PDF, PNG, JPG or WebP statement.");
    if (!transactions.length && !allowEmpty && !pendingPages.length) return { ok: false, error: "No readable transaction rows were found. Try a clearer statement or download its CSV/Excel export from your bank." };
    assertImportRowLimit(transactions.length);
    transactions = completeStatementRows(transactions, { openingBalance, includeBalances: includeBalances || (deferOcr && pendingPages.length > 0) });
    return { ok: true, transactions, extractionMethod, warnings, count: transactions.length, ...(fileType === "pdf" ? { totalPages, openingBalance, pageResults, pendingPages, ocrLayout } : {}) };
  } catch (error) {
    if (/password/i.test(error.name) || /password/i.test(error.message)) {
      const failure = new Error("This PDF needs its password. Enter the bank statement password and try again.");
      failure.code = "PDF_PASSWORD_REQUIRED";
      throw failure;
    }
    if (/invalidpdf|invalid pdf|pdf structure/i.test(error.name + error.message)) throw new Error("This PDF is damaged or unreadable. Download a fresh statement from your bank.");
    throw error;
  } finally {
    if (worker) await worker.terminate().catch(() => {});
    if (parser) await parser.destroy().catch(() => {});
  }
}
