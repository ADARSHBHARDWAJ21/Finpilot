import { identifyColumns, isStatementHeader, parseStatementMatrix } from "./statement-parser.js";
import { parseDirection, parseMoney, parseTransactionDate } from "./transaction-values.js";

const MONEY_FIELDS = ["amount", "debit", "credit", "balance"];
const SUMMARY = /^(?:opening\s+balance|closing\s+balance|balance\s+(?:brought|carried)\s+forward|total\s+(?:debit|credit|withdrawal|deposit)|page\s+\d|continued\b|statement\s+of\s+account|generated\b|www\.|https?:)/i;

function findAnchors(words) {
  const found = [];
  for (let index = 0; index < words.length; index++) {
    for (let length = Math.min(4, words.length - index); length > 0; length--) {
      const phrase = words.slice(index, index + length);
      if (phrase.some((word, offset) => offset && word.x - (phrase[offset - 1].x + phrase[offset - 1].width) > Math.max(10, word.height * 1.2))) continue;
      const label = phrase.map((word) => word.text).join(" ");
      const field = Object.entries(identifyColumns([label])).find(([, value]) => value === 0)?.[0];
      if (!field || found.some((anchor) => anchor.field === field)) continue;
      const last = phrase.at(-1);
      found.push({ field, x: words[index].x, center: (words[index].x + last.x + last.width) / 2 });
      index += length - 1;
      break;
    }
  }
  return found;
}

function mergeMoneyFragments(words) {
  const joined = [];
  for (const word of words) {
    const previous = joined.at(-1);
    const gap = previous ? word.x - (previous.x + previous.width) : Infinity;
    const fragment = previous && (/[\d][.,]$/.test(previous.text) && /^\d{2,3}$/.test(word.text) || /^(?:₹|Rs\.?)$/i.test(previous.text) && parseMoney(word.text) !== null || /^(?:CR|DR)$/i.test(word.text) && parseMoney(previous.text) !== null);
    if (fragment && gap <= Math.max(10, word.height * 1.5)) { previous.text += word.text; previous.width = word.x + word.width - previous.x; }
    else joined.push({ ...word });
  }
  return joined;
}

function groupLines(input) {
  const lines = [];
  for (const word of input.toSorted((a, b) => a.y - b.y || a.x - b.x)) {
    const previous = lines.at(-1);
    if (previous && Math.abs(previous.y - word.y) <= Math.max(2, Math.min(previous.height, word.height) * 0.55)) previous.words.push(word);
    else lines.push({ y: word.y, height: word.height, words: [word] });
  }
  return lines.map((line) => ({ ...line, words: line.words.sort((a, b) => a.x - b.x) }));
}

// Words use coordinates normalized to a width of 1,000, for PDF/OCR page reuse.
export function parsePositionedStatementLayout(input, { layout: previousLayout = null, includeBalances = false, includeSourcePages = false, openingBalance = null } = {}) {
  let anchors = previousLayout?.anchors || [];
  let pendingHeader = [];
  let lastHeaderY = -Infinity;
  const records = [];
  let pending = null;
  const flush = () => { if (pending) records.push(pending); pending = null; };
  for (const line of groupLines(input)) {
    const words = line.words;
    const fullText = words.map((word) => word.text).join(" ");
    const dateInLine = words.some((word) => parseTransactionDate(word.text));
    const found = dateInLine ? [] : findAnchors(words);
    const headerFragment = found.length >= 2 || pendingHeader.length && line.y - lastHeaderY <= line.height * 3 && found.length;
    if (headerFragment) {
      if (line.y - lastHeaderY > line.height * 3) pendingHeader = [];
      for (const anchor of found) if (!pendingHeader.some((entry) => entry.field === anchor.field)) pendingHeader.push(anchor);
      lastHeaderY = line.y;
      const columns = identifyColumns(pendingHeader.map((anchor) => anchor.field));
      if (isStatementHeader(columns)) anchors = pendingHeader.toSorted((a, b) => a.x - b.x);
      continue;
    }
    pendingHeader = [];
    if (SUMMARY.test(fullText)) {
      if (/^opening\s+balance|^balance\s+brought\s+forward/i.test(fullText)) {
        const values = mergeMoneyFragments(words).map((word) => parseMoney(word.text)).filter((value) => value !== null);
        if (!records.length && !pending) openingBalance = values.at(-1) ?? openingBalance;
      }
      continue;
    }
    if (!anchors.length) continue;
    const values = {};
    const dateAnchor = anchors.find((anchor) => anchor.field === "date");
    const descriptionAnchor = anchors.find((anchor) => anchor.field === "description");
    const nextDateColumn = anchors.filter((anchor) => anchor.x > dateAnchor.x).map((anchor) => anchor.x).sort((a, b) => a - b)[0] ?? dateAnchor.x + 150;
    const dateWords = words.filter((word) => word.x >= dateAnchor.x - 20 && word.x < nextDateColumn - 5);
    for (let index = 0; index < dateWords.length; index++) {
      for (let length = Math.min(6, dateWords.length - index); length > 0; length--) {
        const raw = dateWords.slice(index, index + length).map((word) => word.text).join(" ").replace(/\s*([/.-])\s*/g, "$1");
        const date = parseTransactionDate(raw);
        if (date) { values.date = date; break; }
      }
      if (values.date) break;
    }
    if (!values.date && dateWords.length && /^[\dOIl]{1,4}\s*[/.-]/.test(dateWords[0].text)) values.date = dateWords.map((word) => word.text).join(" ");
    const amountWords = [];
    for (const word of mergeMoneyFragments(words)) {
      const nearest = anchors.reduce((best, anchor) => Math.abs(word.x + word.width / 2 - anchor.center) < Math.abs(word.x + word.width / 2 - best.center) ? anchor : best);
      if (MONEY_FIELDS.includes(nearest.field) && (parseMoney(word.text) !== null || /^(?:CR|DR|₹|Rs\.?)$/i.test(word.text))) {
        values[nearest.field] = [values[nearest.field], word.text].filter(Boolean).join(" ");
        amountWords.push(word);
      } else if (nearest.field === "type" && parseDirection(word.text)) values.type = word.text;
    }
    const end = Math.min(...anchors.filter((anchor) => anchor.x > descriptionAnchor.x).map((anchor) => anchor.x), ...amountWords.filter((word) => word.x > descriptionAnchor.x).map((word) => word.x));
    values.description = words.filter((word) => word.x >= descriptionAnchor.x - 12 && word.x < end - 3).map((word) => word.text).join(" ");
    if (values.date) { flush(); pending = { ...values, _sourcePage: dateWords[0]?.sourcePage }; }
    else if (pending) {
      if (values.description) pending.description = [pending.description, values.description].filter(Boolean).join(" ");
      for (const field of [...MONEY_FIELDS, "type"]) if (values[field] && !pending[field]) pending[field] = values[field];
    }
  }
  flush();
  const layout = anchors.length ? { anchors } : previousLayout;
  if (!records.length) return { transactions: [], warnings: [], layout, openingBalance };
  const fields = ["date", "description", "amount", "debit", "credit", "type", "balance"];
  // Only add monetary columns that exist in the statement.
  const present = fields.filter((field) => ["date", "description"].includes(field) || anchors.some((anchor) => anchor.field === field));
  const transactionRecords = records.filter((row) => !/^(?:opening|closing|available|brought forward|carried forward|total)\b.*(?:balance|total)/i.test(row.description || ""));
  if (!transactionRecords.length) return { transactions: [], warnings: [], layout, openingBalance };
  const parsed = parseStatementMatrix([present, ...transactionRecords.map((row) => present.map((field) => row[field] || ""))], { includeBalances, openingBalance });
  return { ...parsed, ...(includeSourcePages ? { transactions: parsed.transactions.map((row, index) => ({ ...row, _sourcePage: transactionRecords[index]._sourcePage })) } : {}), layout, openingBalance };
}

export function parseOcrStatementLayout(tsv, options = {}) {
  const records = String(tsv || "").split(/\r?\n/).map((record) => record.split("\t"));
  const width = Number(records.find((cells) => cells[0] === "1")?.[8]) || 2200;
  const scale = 1000 / width;
  const words = records.filter((cells) => cells[0] === "5" && cells[11]?.trim()).map((cells) => ({ text: cells.slice(11).join("\t").trim(), x: Number(cells[6]) * scale, y: (Number(cells[7]) + Number(cells[9])) * scale, width: Number(cells[8]) * scale, height: Number(cells[9]) * scale }));
  return parsePositionedStatementLayout(words, options);
}
