import { z } from "zod";

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(3000),
  conversationId: z.string().uuid().nullable().optional(),
}).strict();

const money = z.number().finite().min(0).max(100000000);
export const taxChangeSchema = z.object({
  financialYear: z.enum(["2024-25", "2025-26", "2026-27"]).optional(),
  baselineAnnualSalary: money.optional(),
  annualSalary: money.optional(),
  increasePercent: z.number().finite().min(-100).max(1000).optional(),
  monthsRemaining: z.number().int().min(1).max(12).optional(),
  monthlyRent: money.optional(),
  section80c: money.optional(),
  personalNps: money.optional(),
  employerNps: money.optional(),
  governmentEmployer: z.boolean().optional(),
  healthInsurance: money.optional(),
  parentsHealthInsurance: money.optional(),
  parentsSenior: z.boolean().optional(),
  educationLoanInterest: money.optional(),
  confirmedHomeLoanInterest: money.optional(),
}).strict().refine((data) => data.annualSalary == null || data.increasePercent == null, "Supply annualSalary or increasePercent, not both.");

export const emiSchema = z.object({
  principal: money,
  annualRatePercent: z.number().finite().min(0).max(60),
  tenureMonths: z.number().int().min(1).max(480),
}).strict();

// Bounds expense spikes and protects a single long-running model loop.
const buckets = new Map();
export function allowCopilotRequest(userId, now = Date.now()) {
  for (const [key, bucket] of buckets) if (bucket.expires <= now) buckets.delete(key);
  const bucket = buckets.get(userId) || { count: 0, expires: now + 60000 };
  if (bucket.count >= 8) return false;
  bucket.count += 1;
  buckets.set(userId, bucket);
  return true;
}
