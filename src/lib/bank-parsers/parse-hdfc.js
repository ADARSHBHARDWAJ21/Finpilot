export function parseHDFC(text) {
  const lines = text.split("\n");
  const transactions = [];

  for (const line of lines) {
    const match = line.match(/(\d{2}\/\d{2}\/\d{2,4})\s+(.*?)\s+([-\d,]+\.\d{2})/);

    if (match) {
      transactions.push({
        date: match[1],
        description: match[2].trim(),
        amount: Number(match[3].replace(/,/g, "")),
      });
    }
  }

  return transactions;
}

/** @deprecated use parseHDFC */
export const parseHDFCStatement = parseHDFC;
