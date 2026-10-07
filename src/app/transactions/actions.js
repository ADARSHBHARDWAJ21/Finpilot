"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server-client";
import { saveImportedTransactions } from "@/lib/import/save-import";
import { deleteOwnedTransactions, deleteAllOwnedTransactions } from "@/lib/transactions/records";

function refreshTransactionPages() {
  for (const path of ["/transactions", "/dashboard", "/budget-tracker", "/reports", "/net-worth", "/taxation", "/taxation/ai-copilot"]) revalidatePath(path);
}

export async function saveTransactions(transactions) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Please sign in again before importing transactions.");
  const result = await saveImportedTransactions(supabase, user.id, transactions);
  if (result.count) {
    refreshTransactionPages();
  }
  return result;
}

export async function deleteTransaction(transactionId) {
  const result = await deleteTransactions([transactionId]);
  if (result.error) throw new Error(result.error);
  if (!result.count) throw new Error("Transaction not found or already deleted");
  return { success: true, id: result.deletedIds[0] };
}

export async function deleteTransactions(transactionIds) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Please sign in again to delete transactions.");
  const result = await deleteOwnedTransactions(supabase, user.id, transactionIds);
  refreshTransactionPages();
  return result;
}

export async function deleteAllTransactions() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Please sign in again to delete transactions.");
  const result = await deleteAllOwnedTransactions(supabase, user.id);
  refreshTransactionPages();
  return result;
}

export async function addManualTransaction(input) {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a valid amount greater than 0");
  }

  const type = input.type === "income" ? "income" : "expense";

  return saveTransactions([
    {
      date: input.date,
      description: input.description,
      amount: type === "expense" ? -amount : amount,
      type,
      category: input.category,
      payment_method: input.payment_method,
    },
  ]);
}

