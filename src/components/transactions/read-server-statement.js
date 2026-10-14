import { completeStatementRows } from "../../lib/import/statement-parser.js";
import { assertImportRowLimit, MAX_PDF_PAGES } from "../../lib/import/transaction-values.js";
import { STATEMENT_TIMEOUT_MESSAGE } from "../../lib/ingestion/statement-errors.js";

const summaryWarning = /^(?:PDF page \d+: at least |\d+ PDF page\(s\) used text recognition\.|No transaction rows were found on PDF page\(s\))/;

// Upload once, then recognize scanned pages in separate bounded requests. No
// preview is returned until every pending page succeeds.
export async function readServerStatement(file, { password = "", onProgress = () => {}, fetchImpl = globalThis.fetch, timeoutMs = 175_000 } = {}) {
  let sessionId;
  let finished = false;
  async function request(url, options) {
    const response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
    let result;
    try { result = await response.json(); }
    catch { throw new Error(response.status === 504 || response.status === 408 ? STATEMENT_TIMEOUT_MESSAGE : "The upload service did not respond correctly. Refresh the page and try again."); }
    if (!response.ok || !result.success) throw Object.assign(new Error(result.error || "Could not process the statement."), { code: result.code });
    return result;
  }
  try {
    onProgress("Reading your statement…");
    const form = new FormData();
    form.append("file", file);
    if (/\.pdf$/i.test(file.name) && password) form.append("password", password);
    const initial = await request("/api/process-statement", { method: "POST", body: form });
    sessionId = initial.sessionId;
    if (!sessionId) { finished = true; return initial; }
    const totalPages = initial.totalPages;
    if (!Number.isInteger(totalPages) || totalPages < 1 || totalPages > MAX_PDF_PAGES || !Array.isArray(initial.pageResults) || !initial.pendingPages?.length) throw new Error("The upload service returned an incomplete statement. Try uploading it again.");
    const pages = new Map(initial.pageResults.map((page) => [page.num, page]));
    const pendingPages = [...initial.pendingPages];
    if (initial.pageResults.length !== totalPages || pages.size !== totalPages || [...pages.values()].some((page) => !Number.isInteger(page.num) || page.num < 1 || page.num > totalPages || !Array.isArray(page.transactions)) || pendingPages.some((page, index) => !Number.isInteger(page) || !pages.has(page) || (index > 0 && page <= pendingPages[index - 1]))) throw new Error("The upload service returned an incomplete statement. Try uploading it again.");
    const scannedPages = new Set();
    const warnings = (initial.warnings || []).filter((warning) => !summaryWarning.test(warning));
    let openingBalance = initial.openingBalance ?? null;
    for (let index = 0; index < pendingPages.length; index++) {
      const page = pendingPages[index];
      onProgress(`Reading page ${page} of ${totalPages}…`);
      const result = await request(`/api/process-statement?session=${encodeURIComponent(sessionId)}&page=${page}`, { method: "POST" });
      const replacement = result.pageResults?.find((entry) => entry.num === page);
      const expectedRemaining = pendingPages.slice(index + 1);
      if (result.processedPage !== page || !replacement || !Array.isArray(replacement.transactions) || !Array.isArray(result.remainingPages) || result.remainingPages.length !== expectedRemaining.length || result.remainingPages.some((value, position) => value !== expectedRemaining[position])) throw new Error("The upload service returned an incomplete statement. Try uploading it again.");
      // OCR supplies the authoritative page rows, replacing native candidates
      // rather than appending the same transactions twice.
      pages.set(page, replacement);
      scannedPages.add(page);
      openingBalance ??= result.openingBalance ?? replacement.openingBalance ?? null;
      warnings.push(...(result.warnings || []).filter((warning) => !summaryWarning.test(warning)));
      assertImportRowLimit([...pages.values()].reduce((count, entry) => count + entry.transactions.length, 0));
    }
    const orderedPages = [...pages.values()].sort((a, b) => a.num - b.num);
    const rows = orderedPages.flatMap((page) => page.transactions.map((row) => ({ ...row })));
    if (!rows.length) throw new Error("No readable transaction rows were found. Try a clearer statement or download its CSV/Excel export from your bank.");
    assertImportRowLimit(rows.length);
    const emptyPages = [];
    for (const page of orderedPages) {
      if (page.informational) continue;
      if (!page.transactions.length) emptyPages.push(page.num);
      else if (page.transactions.length < page.expectedRows) warnings.push(`PDF page ${page.num}: at least ${page.expectedRows} dated rows were detected, but only ${page.transactions.length} were read. Check this page against the preview; a clearer bank export can recover the missing rows.`);
    }
    if (scannedPages.size) warnings.push(`${scannedPages.size} PDF page(s) used text recognition. Please check every extracted row.`);
    if (emptyPages.length) warnings.push(`No transaction rows were found on PDF page(s) ${emptyPages.join(", ")}. Check whether those pages contain transactions before importing.`);
    const transactions = completeStatementRows(rows, { openingBalance });
    finished = true;
    return { success: true, transactions, count: transactions.length, warnings: [...new Set(warnings)], extractionMethod: "PDF with text recognition" };
  } finally {
    if (sessionId && !finished) {
      // Cancel an abandoned session even when the OCR request times out. The
      // server removes its file when an in-flight page finishes.
      await fetchImpl(`/api/process-statement?session=${encodeURIComponent(sessionId)}`, { method: "DELETE", signal: AbortSignal.timeout(10_000) }).catch(() => {});
    }
  }
}
