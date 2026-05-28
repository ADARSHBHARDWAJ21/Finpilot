export function parseICICI(text) {
  const lines = text.split("\n");
  const transactions = [];

  for (const line of lines) {
    const match = line.match(/(\d{2}-\d{2}-\d{4})\s+(.*?)\s+([-\d,]+\.\d{2})/);

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

/** @deprecated use parseICICI */
export const parseICICIStatement = parseICICI;
