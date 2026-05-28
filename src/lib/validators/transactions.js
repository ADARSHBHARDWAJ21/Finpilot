import { z } from "zod";

const rawTransactionSchema = z.object({
  date: z.union([z.string(), z.number()]).optional(),
  transaction_date: z.string().optional(),
  description: z.string().optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().optional(),
  payment_method: z.string().optional(),
  confidence_score: z.number().min(0).max(100).optional(),
});

export function validateTransactions(transactions) {
  if (!Array.isArray(transactions)) return [];

  return transactions
    .map((tx) => {
      const parsed = rawTransactionSchema.safeParse(tx);
      if (!parsed.success) return null;

      const row = parsed.data;
      const date = row.transaction_date || row.date;
      const description = row.description?.trim();
      const amount = row.amount;

      if (!date || !description || amount === undefined || amount === null) {
        return null;
      }

      const numAmount = Number(String(amount).replace(/,/g, ""));
      if (!Number.isFinite(numAmount) || numAmount === 0) return null;

      return {
        date: String(date),
        description,
        amount: numAmount,
        type: row.type,
        category: row.category,
        payment_method: row.payment_method,
        confidence_score: row.confidence_score,
      };
    })
    .filter(Boolean);
}
