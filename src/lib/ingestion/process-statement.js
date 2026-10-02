import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";
import sharp from "sharp";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { parseStatementText, parseStatementMatrix, completeStatementRows, countStatementDateRows } from "../import/statement-parser.js";
import { parseOcrStatementLayout, parsePositionedStatementLayout } from "../import/ocr-layout-parser.js";
import { validateImportRow, MAX_IMPORT_ROWS } from "../import/transaction-values.js";
import { readPdfPositionedPages } from "./pdf-positioned-text.js";

const MAX_PAGES = 20;
const MAX_RUNTIME_MS = 150_000;
const readable = (value) => value?.transactions?.filter((row) => !validateImportRow(row).issues.length).length || 0;

export function selectStatementExtraction(candidates) {
  return candidates.filter(Boolean).map((value, index) => ({ value, index, valid: readable(value), fields: value.transactions.reduce((sum, row) => sum + 4 - validateImportRow(row).issues.length, 0) })).sort((a, b) => b.valid - a.valid || b.value.transactions.length - a.value.transactions.length || b.fields - a.fields || a.index - b.index)[0]?.value || { transactions: [], warnings: [] };
}

export async function processStatement(buffer, fileType, mimeType = "", { password = "" } = {}) {
  const deadline = Date.now() + MAX_RUNTIME_MS;
  let worker;
  let parser;
  const warnings = [];
  const remaining = () => {
    const time = deadline - Date.now();
    if (time <= 0) throw new Error("Processing took too long. Split the statement into smaller files and try again.");
    return time;
  };
  async function timed(promise) {
    let timer;
    try {
      return await Promise.race([promise, new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Processing took too long. Split the statement into smaller files and try again.")), remaining());
      })]);
    } finally { clearTimeout(timer); }
  }
  async function recognize(image, { layout: previousLayout = null, expectedRows = 0 } = {}) {
    if (!worker) {
      const cachePath = path.join(process.cwd(), ".cache", "ocr");
      await mkdir(cachePath, { recursive: true });
      const creating = createWorker("eng", 1, { cachePath, logger: () => {}, errorHandler: () => {} });
      try { worker = await timed(creating); }
      catch (error) { creating.then((lateWorker) => lateWorker.terminate()).catch(() => {}); throw error; }
    }
    const imageData = await sharp(image, { limitInputPixels: 40_000_000 }).rotate().flatten({ background: "white" }).resize({ width: 2200, withoutEnlargement: false }).grayscale().normalize().sharpen().png().toBuffer();
    const candidates = [];
    let dateRows = expectedRows;
    let nextLayout = previousLayout;
    for (const mode of ["6", "11"]) {
      await worker.setParameters({ preserve_interword_spaces: "1", tessedit_pageseg_mode: mode });
      const result = await timed(worker.recognize(imageData, {}, { text: true, tsv: true }));
      const text = result.data.text || "";
      dateRows = Math.max(dateRows, countStatementDateRows(text));
      let layout;
      try { layout = parseOcrStatementLayout(result.data.tsv, { layout: previousLayout, includeBalances: true }); }
      catch (error) { if (error.message.includes("1,000")) throw error; }
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
    if (fileType === "image") {
      const image = await recognize(buffer);
      transactions = image.transactions;
      openingBalance = image.openingBalance;
      if (image.dateRows > transactions.length) warnings.push(`The image contains at least ${image.dateRows} dated rows, but only ${transactions.length} were read. Upload a clearer image or a CSV/Excel export to recover the remaining rows.`);
    } else if (fileType === "pdf") {
      parser = new PDFParse({ data: buffer, ...(password ? { password } : {}) });
      const info = await timed(parser.getInfo());
      if (info.total > MAX_PAGES) throw new Error("This PDF has more than 20 pages. Split it into smaller PDFs so every page can be checked.");
      const extracted = await timed(parser.getText({ cellSeparator: "\t", pageJoiner: "" }));
      const positionedPages = await readPdfPositionedPages(buffer, { password, timed });
      let documentLayout;
      let offset = 0;
      const documentWords = positionedPages.flatMap((page) => {
        const words = page.words.map((word) => ({ ...word, y: word.y + offset, sourcePage: page.num }));
        offset += page.words.reduce((maximum, word) => Math.max(maximum, word.y), 0) + 100;
        return words;
      });
      try { documentLayout = parsePositionedStatementLayout(documentWords, { includeBalances: true, includeSourcePages: true }); }
      catch (error) { if (error.message.includes("1,000")) throw error; }
      let tables = { pages: [] };
      try { tables = await timed(parser.getTable()); }
      catch (error) { remaining(); if (error.message.includes("Processing took too long")) throw error; }
      let scannedCount = 0;
      let nativeLayout = null;
      let ocrLayout = null;
      const emptyPages = [];
      for (const page of extracted.pages) {
        remaining();
        const plain = parseStatementText(page.text, { includeBalances: true });
        const original = positionedPages.find((entry) => entry.num === page.num);
        let positioned;
        try { positioned = parsePositionedStatementLayout(original?.words || [], { layout: nativeLayout, includeBalances: true }); }
        catch (error) { if (error.message.includes("1,000")) throw error; }
        if (positioned?.layout) nativeLayout = positioned.layout;
        const tableCandidates = [];
        for (const table of tables.pages.find((entry) => entry.num === page.num)?.tables || []) {
          try { tableCandidates.push(...parseStatementMatrix(table, { includeBalances: true }).transactions); }
          catch (error) { if (error.message.includes("1,000")) throw error; }
        }
        const fromDocument = documentLayout ? { transactions: documentLayout.transactions.filter((row) => row._sourcePage === page.num), openingBalance: documentLayout.openingBalance } : null;
        const candidates = [fromDocument, positioned, { transactions: tableCandidates, warnings: [] }, plain];
        let selected = selectStatementExtraction(candidates);
        let expectedRows = countStatementDateRows(page.text);
        // A page may contain readable text AND scanned rows. Existing valid
        // rows alone are not proof that the whole page has been read.
        if (original?.hasImages || !selected.transactions.length || readable(selected) < selected.transactions.length || selected.transactions.length < expectedRows) {
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
        if (!selected.transactions.length) emptyPages.push(page.num);
        else if (selected.transactions.length < expectedRows) warnings.push(`PDF page ${page.num}: at least ${expectedRows} dated rows were detected, but only ${selected.transactions.length} were read. Check this page against the preview; a clearer bank export can recover the missing rows.`);
        if (transactions.length > MAX_IMPORT_ROWS) throw new Error("This statement has more than 1,000 rows. Split it into smaller files.");
      }
      extractionMethod = scannedCount ? "PDF with text recognition" : "PDF text";
      if (scannedCount) warnings.push(`${scannedCount} PDF page(s) used text recognition. Please check every extracted row.`);
      if (emptyPages.length) warnings.push(`No transaction rows were found on PDF page(s) ${emptyPages.join(", ")}. Check whether those pages contain transactions before importing.`);
    } else throw new Error("Choose a PDF, PNG, JPG or WebP statement.");
    if (!transactions.length) return { ok: false, error: "No readable transaction rows were found. Try a clearer statement or download its CSV/Excel export from your bank." };
    if (transactions.length > MAX_IMPORT_ROWS) throw new Error("This statement has more than 1,000 rows. Split it into smaller files.");
    transactions = completeStatementRows(transactions, { openingBalance });
    return { ok: true, transactions, extractionMethod, warnings, count: transactions.length };
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
