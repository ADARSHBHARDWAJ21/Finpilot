"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server-client";
import { saveImportedTransactions } from "@/lib/import/save-import";

export async function saveTransactions(transactions) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Please sign in again before importing transactions.");
  const result = await saveImportedTransactions(supabase, user.id, transactions);
  if (result.count) {
    for (const path of ["/transactions", "/dashboard", "/budget-tracker", "/reports", "/net-worth", "/taxation/ai-copilot"]) revalidatePath(path);
  }
  return result;
}

export async function deleteTransaction(transactionId) {
  if (!transactionId) {
    throw new Error("Transaction not found");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Transaction not found or already deleted");
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budget-tracker");
  revalidatePath("/reports");
  revalidatePath("/net-worth");

  return { success: true, id: data.id };
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

