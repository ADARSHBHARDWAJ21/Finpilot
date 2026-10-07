import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { summaryRows } from "./reports.js";
export async function reportPdf(report) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica),
    bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  pdf.setTitle(`Finpilot financial report ${report.year}`);
  let page, y;
  const newPage = () => {
    page = pdf.addPage([595.28, 841.89]);
    y = 785;
    page.drawText(`FINPILOT  /  FY ${report.year}`, {
      x: 45,
      y,
      font: bold,
      size: 17,
      color: rgb(0.29, 0.19, 0.65),
    });
    y -= 35;
  };
  newPage();
  function line(text, isBold = false) {
    if (y < 55) newPage();
    page.drawText(text, {
      x: 45,
      y,
      font: isBold ? bold : font,
      size: 10,
      color: rgb(0.15, 0.2, 0.28),
    });
    y -= 15;
  }
  function wrap(value) {
    const text = String(value)
      .replace(/₹/g, "INR ")
      .replace(/[–—]/g, "-")
      .replace(/[^\x20-\x7e]/g, "?");
    const words = text.split(/\s+/);
    let current = "";
    for (const word of words) {
      if (font.widthOfTextAtSize(`${current} ${word}`, 10) > 495 && current) {
        line(current);
        current = "";
      }
      if (word.length > 80) {
        if (current) {
          line(current);
          current = "";
        }
        for (let i = 0; i < word.length; i += 70) line(word.slice(i, i + 70));
      } else current += (current ? " " : "") + word;
    }
    if (current) line(current);
  }
  for (const [label, value] of summaryRows(report)) {
    if (y < 100) newPage();
    line(label, true);
    wrap(value);
    y -= 9;
  }
  const pages = pdf.getPages();
  pages.forEach((p, i) =>
    p.drawText(`Personal records and estimates | ${i + 1} / ${pages.length}`, {
      x: 45,
      y: 30,
      font,
      size: 8,
      color: rgb(0.45, 0.48, 0.55),
    }),
  );
  return pdf.save();
}
