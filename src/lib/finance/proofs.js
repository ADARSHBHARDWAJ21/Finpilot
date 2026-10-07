import { validateProofTarget } from "./data.js";

export const MAX_PROOF_BYTES = 10 * 1024 * 1024;
const types = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  csv: "text/csv",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
export function validateProof({ name, bytes, year, section, proofKey }) {
  validateProofTarget(year, section, proofKey);
  if (!bytes?.length || bytes.length > MAX_PROOF_BYTES)
    throw new Error("Choose a non-empty file up to 10 MB.");
  const ext = String(name).split(".").pop().toLowerCase();
  const mime = types[ext];
  const prefix = Buffer.from(bytes.subarray(0, 12));
  const valid =
    ext === "pdf"
      ? prefix.toString().startsWith("%PDF-")
      : ext === "png"
        ? prefix
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : ["jpg", "jpeg"].includes(ext)
          ? prefix[0] === 255 && prefix[1] === 216 && prefix[2] === 255
          : ext === "webp"
            ? prefix.toString().startsWith("RIFF") &&
              prefix.subarray(8).toString() === "WEBP"
            : ext === "xlsx"
              ? prefix[0] === 80 && prefix[1] === 75
              : ext === "csv"
                ? !bytes.includes(0)
                : false;
  if (!mime || !valid)
    throw new Error("Upload a valid PDF, PNG, JPG, WebP, CSV or XLSX file.");
  const safeName = String(name)
    .split(/[\\/]/)
    .pop()
    .replace(/[\x00-\x1f\x7f]/g, "")
    .slice(0, 180);
  return { ext, mime, name: safeName || `proof.${ext}` };
}
export function proofHeaders(document) {
  return {
    "Content-Type": document.mime_type,
    "Content-Disposition": `attachment; filename="proof.${document.name
      .split(".")
      .pop()
      .replace(
        /[^a-zA-Z0-9]/g,
        "",
      )}"; filename*=UTF-8''${encodeURIComponent(document.name).replace(/['()*]/g, (c) => "%" + c.charCodeAt(0).toString(16))}`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
}
