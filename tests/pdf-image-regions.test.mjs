import test from "node:test";
import assert from "node:assert/strict";
import { OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import { getPdfImageCoverage, readPdfPositionedPages } from "../src/lib/ingestion/pdf-positioned-text.js";

const viewport = { width: 600, height: 800, convertToViewportPoint: (x, y) => [x, 800 - y] };
const word = (text, x, y, width = 70) => ({ text, x, y, width, height: 12 });
const transactionWords = [word("01/09/2026", 30, 400), word("COFFEE", 200, 400), word("450.00", 750, 400)];
const operations = (entries) => ({ fnArray: entries.map(([operation]) => operation), argsArray: entries.map(([, args = []]) => args) });
const image = (matrix) => operations([[OPS.save], [OPS.transform, matrix], [OPS.paintImageXObject, ["image"]], [OPS.restore]]);

test("a wide bank masthead above native table headings does not trigger OCR", () => {
  const words = [word("Date", 40, 500), word("Particulars", 220, 500), word("Deposits", 530, 500), word("Withdrawals", 710, 500), word("Balance", 890, 500), ...transactionWords.map((entry) => ({ ...entry, y: 620 }))];
  const banner = image([570, 0, 0, 105, 15, 660]);
  assert.equal(getPdfImageCoverage(banner, viewport, words).needsImageOcr, false);
  assert.equal(getPdfImageCoverage(banner, viewport, transactionWords).needsImageOcr, true);
  assert.equal(getPdfImageCoverage(image([570, 0, 0, 105, 15, 450]), viewport, words).needsImageOcr, true);
});

test("small header logos do not send native statement pages through OCR", () => {
  const result = getPdfImageCoverage(image([90, 0, 0, 30, 30, 740]), viewport, transactionWords);
  assert.equal(result.hasImages, true);
  assert.equal(result.needsImageOcr, false);
  assert.deepEqual(result.imageRegions, [{ x: 50, y: 50, width: 150, height: 50 }]);
});

test("wide scanned rows and image snippets within the transaction area still need OCR", () => {
  for (const matrix of [[520, 0, 0, 114, 40, 500], [520, 0, 0, 20, 40, 500], [90, 0, 0, 30, 30, 500], [600, 0, 0, 800, 0, 0]]) {
    assert.equal(getPdfImageCoverage(image(matrix), viewport, transactionWords).needsImageOcr, true);
  }
  assert.equal(getPdfImageCoverage(image([90, 0, 0, 30, 30, 740]), viewport).needsImageOcr, true);
});

test("a full-page scan still needs OCR even when a dense native overlay covers it", () => {
  const words = Array.from({ length: 12 }, (_, index) => [word("01/09/2026", 30, 80 + index * 106), word("COFFEE", 200, 80 + index * 106), word("450.00", 750, 80 + index * 106), word("9500.00", 880, 80 + index * 106)]).flat();
  const background = image([600, 0, 0, 800, 0, 0]);
  assert.equal(getPdfImageCoverage(background, viewport, words).needsImageOcr, true);
  assert.equal(getPdfImageCoverage(background, viewport, words.slice(0, 8)).needsImageOcr, true);
  assert.equal(getPdfImageCoverage(background, viewport, words.filter((entry) => entry.y < 550 || entry.y > 900)).needsImageOcr, true);
});

test("transforms restore correctly around nested forms and rotated images", () => {
  const result = getPdfImageCoverage(operations([
    [OPS.save], [OPS.transform, [1, 0, 0, 1, 30, 740]],
    [OPS.paintFormXObjectBegin, [[90, 0, 0, 30, 0, 0], null]], [OPS.paintImageXObject, ["logo"]], [OPS.paintFormXObjectEnd], [OPS.restore],
    [OPS.save], [OPS.transform, [0, 520, -114, 0, 550, 40]], [OPS.paintInlineImageXObject, [{}]], [OPS.restore],
  ]), viewport, transactionWords);
  assert.equal(result.imageRegions.length, 2);
  assert.deepEqual(result.imageRegions[0], { x: 50, y: 50, width: 150, height: 50 });
  assert.ok(Math.abs(result.imageRegions[1].width - 190) < 0.001);
  assert.ok(Math.abs(result.imageRegions[1].height - 520 / 600 * 1000) < 0.001);
  assert.equal(result.needsImageOcr, true);
});

test("repeated images and inline or mask image groups retain their painted footprints", () => {
  const result = getPdfImageCoverage(operations([
    [OPS.paintImageXObjectRepeat, ["logo", 90, 30, new Float32Array([30, 740, 420, 740])]],
    [OPS.paintInlineImageXObjectGroup, [{}, [{ transform: [520, 0, 0, 114, 40, 500] }]]],
    [OPS.paintImageMaskXObjectGroup, [[{ transform: [90, 0, 0, 30, 30, 740] }]]],
    [OPS.paintImageMaskXObjectRepeat, [{}, 90, 0, 0, 30, new Float32Array([30, 740])]],
  ]), viewport, transactionWords);
  assert.equal(result.imageRegions.length, 5);
  assert.equal(result.needsImageOcr, true);
  assert.equal(getPdfImageCoverage(operations([[OPS.paintImageXObjectRepeat, ["logo", 90, 30, [30, 740, 420, 740]]]]), viewport, transactionWords).needsImageOcr, false);
});

test("unknown image geometry conservatively requests OCR", () => {
  for (const entries of [
    [[OPS.transform, [Number.NaN, 0, 0, 30, 30, 740]], [OPS.paintImageXObject, ["image"]]],
    [[OPS.paintImageXObjectRepeat, ["image", 90, 30, [30]]]],
    [[OPS.paintInlineImageXObjectGroup, [{}, [{ transform: null }]]]],
    [[OPS.paintXObject, ["image"]]],
    [[OPS.beginAnnotation], [OPS.paintImageXObject, ["image"]], [OPS.endAnnotation]],
  ]) assert.equal(getPdfImageCoverage(operations(entries), viewport, transactionWords).needsImageOcr, true);
  assert.equal(getPdfImageCoverage(operations([]), viewport, transactionWords).needsImageOcr, false);
});

function rawPdf(objects) {
  const chunks = [Buffer.from("%PDF-1.4\n")];
  const offsets = [];
  let size = chunks[0].length;
  for (let index = 0; index < objects.length; index++) {
    offsets.push(size);
    const chunk = Buffer.concat([Buffer.from(`${index + 1} 0 obj\n`), Buffer.isBuffer(objects[index]) ? objects[index] : Buffer.from(objects[index]), Buffer.from("\nendobj\n")]);
    chunks.push(chunk);
    size += chunk.length;
  }
  chunks.push(Buffer.from(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${size}\n%%EOF`));
  return Buffer.concat(chunks);
}

test("real PDF operator lists distinguish a bank logo from scanned statement rows", async () => {
  const pixel = Buffer.concat([Buffer.from("<< /Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length 3 >>\nstream\n"), Buffer.from([0, 0, 0]), Buffer.from("\nendstream")]);
  for (const [matrix, needsImageOcr] of [["90 0 0 30 30 740", false], ["520 0 0 114 40 500", true]]) {
    const stream = `BT /F1 12 Tf 30 560 Td (01/09/2026 COFFEE 450.00 DR) Tj ET\nq ${matrix} cm /Im1 Do Q`;
    const bytes = rawPdf([
      "<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 4 0 R >> /XObject << /Im1 5 0 R >> >> /Contents 6 0 R >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>", pixel, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    ]);
    const [page] = await readPdfPositionedPages(bytes);
    assert.equal(page.hasImages, true);
    assert.equal(page.imageRegions.length, 1);
    assert.equal(page.needsImageOcr, needsImageOcr);
  }
});

test("a scanned image in a transparent PDF form keeps its visible footprint", async () => {
  const pixel = Buffer.concat([Buffer.from("<< /Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length 3 >>\nstream\n"), Buffer.from([0, 0, 0]), Buffer.from("\nendstream")]);
  const pageStream = "BT /F1 12 Tf 30 560 Td (01/09/2026 COFFEE 450.00 DR) Tj ET\n/Fm1 Do\nq 90 0 0 30 30 740 cm /Im1 Do Q";
  const formStream = "/Im1 Do";
  const bytes = rawPdf([
    "<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 4 0 R >> /XObject << /Im1 5 0 R /Fm1 7 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>", pixel,
    `<< /Length ${pageStream.length} >>\nstream\n${pageStream}\nendstream`,
    `<< /Type /XObject /Subtype /Form /BBox [0 0 1 1] /Matrix [520 0 0 114 40 500] /Group << /Type /Group /S /Transparency /I true >> /Resources << /XObject << /Im1 5 0 R >> >> /Length ${formStream.length} >>\nstream\n${formStream}\nendstream`,
  ]);
  const [page] = await readPdfPositionedPages(bytes);
  assert.equal(page.hasImages, true);
  assert.equal(page.needsImageOcr, true);
  assert.equal(page.imageRegions.length, 2);
  assert.ok(Math.abs(page.imageRegions[0].x - 40 / 600 * 1000) < 0.001);
  assert.ok(Math.abs(page.imageRegions[0].y - 186 / 600 * 1000) < 0.001);
  assert.ok(Math.abs(page.imageRegions[0].width - 520 / 600 * 1000) < 0.001);
  assert.ok(Math.abs(page.imageRegions[0].height - 114 / 600 * 1000) < 0.001);
  assert.deepEqual(page.imageRegions[1], { x: 50, y: 50, width: 150, height: 50 });
});
