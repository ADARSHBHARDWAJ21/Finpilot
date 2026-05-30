"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server-client";
import { applyCategoryRules } from "@/lib/bank-parsers/category-rules";

function isValidRow(row) {
  if (!row) return false;

  const date = row.transaction_date || row.date;
  const description = row.description;
  const amount = row.amount;

  const hasDate = date && String(date).trim();
  const hasDescription = description && String(description).trim();
  const hasAmount =
    amount !== undefined && amount !== null && String(amount).trim() !== "";

  return Boolean(hasDate && hasDescription && hasAmount);
}

function optionalImportMeta(tx) {
  const score =
    tx.confidence_score !== undefined && tx.confidence_score !== null
      ? Number(tx.confidence_score)
      : 100;

  const reviewStatus =
    tx.review_status ||
    (Number.isFinite(score) && score < 70 ? "needs_review" : "completed");

  return {
    confidence_score: Number.isFinite(score) ? score : 100,
    review_status: reviewStatus,
  };
}

function formatRowForDb(tx, userId, { includeImportMeta = true } = {}) {
  const date = String(tx.transaction_date || tx.date).trim();
  const description = String(tx.description).trim();
  const meta = includeImportMeta ? optionalImportMeta(tx) : {};

  if (tx.transaction_date && (tx.type === "income" || tx.type === "expense")) {
    return {
      user_id: userId,
      transaction_date: date,
      description,
      amount: Math.abs(Number(tx.amount)),
      type: tx.type,
      category: tx.category?.trim() || applyCategoryRules(description),
      payment_method: tx.payment_method?.trim() || "Bank",
      ...meta,
    };
  }

  const rawAmount = Number(tx.amount);
  const amount = Math.abs(rawAmount);
  const explicitType =
    tx.type === "income" || tx.type === "expense" ? tx.type : null;

  return {
    user_id: userId,
    transaction_date: date,
    description,
    amount,
    type: explicitType ?? (rawAmount > 0 ? "income" : "expense"),
    category: applyCategoryRules(description, tx.category?.trim()),
    payment_method: tx.payment_method?.trim() || "Unknown",
    ...meta,
  };
}

function stripImportMeta(rows) {
  return rows.map(({ confidence_score: _score, review_status: _status, ...row }) => row);
}

function isMissingImportColumnsError(error) {
  const message = String(error?.message || "");
  return /confidence_score|review_status/i.test(message);
}

async function insertTransactions(supabase, rows) {
  const attempt = await supabase.from("transactions").insert(rows).select("*");
  if (!attempt.error || !isMissingImportColumnsError(attempt.error)) {
    return attempt;
  }

  return supabase.from("transactions").insert(stripImportMeta(rows)).select("*");
}

async function filterDuplicates(supabase, userId, formatted) {
  if (formatted.length === 0) {
    return { toInsert: [], skipped: 0 };
  }

  const toInsert = [];
  let skipped = 0;
  const batchKeys = new Set();

  for (const tx of formatted) {
    const batchKey = `${tx.transaction_date}|${tx.amount}|${tx.description}`;
    if (batchKeys.has(batchKey)) {
      skipped++;
      continue;
    }

    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("transaction_date", tx.transaction_date)
      .eq("amount", tx.amount)
      .eq("description", tx.description)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    batchKeys.add(batchKey);
    toInsert.push(tx);
  }

  return { toInsert, skipped };
}

export async function saveTransactions(transactions) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const validRows = (transactions || []).filter(isValidRow);

  if (validRows.length === 0) {
    throw new Error(
      "No valid transactions found. Each row needs date, description, and amount."
    );
  }

  const formatted = validRows.map((tx) => formatRowForDb(tx, user.id));
  const { toInsert, skipped } = await filterDuplicates(supabase, user.id, formatted);

  if (toInsert.length === 0) {
    return {
      count: 0,
      skipped,
      transactions: [],
      message:
        skipped > 0
          ? `${skipped} duplicate${skipped === 1 ? "" : "s"} skipped — nothing new to import.`
          : "Nothing to import.",
    };
  }

  const { data, error } = await insertTransactions(supabase, toInsert);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budget-tracker");

  return {
    count: data?.length ?? toInsert.length,
    skipped,
    transactions: data ?? [],
  };
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
