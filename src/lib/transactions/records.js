import { shiftMonth, validMonthKey } from "../dashboard/period.js";

const PAGE_SIZE = 1000;
const DELETE_BATCH_SIZE = 100;
const ID_PATTERN = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[1-9][0-9]{0,18})$/i;

function requireAccount(userId) {
  if (!userId) throw new Error("Please sign in again to manage transactions.");
}

export async function loadOwnedTransactions(supabase, userId) {
  requireAccount(userId);
  const transactions = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.from("transactions").select("*")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false }).order("id", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error || !Array.isArray(data)) throw new Error("Transactions could not be loaded. Refresh the page to try again.");
    transactions.push(...data);
    if (data.length < PAGE_SIZE) return transactions;
  }
}

export async function deleteOwnedTransactions(supabase, userId, transactionIds) {
  requireAccount(userId);
  if (!Array.isArray(transactionIds) || !transactionIds.length || transactionIds.length > 10000) {
    throw new Error("Select between 1 and 10,000 transactions, or use Delete selected month.");
  }
  const ids = transactionIds.map((id) => {
    if (!(["string", "number"].includes(typeof id)) || !ID_PATTERN.test(String(id)) || (typeof id === "number" && !Number.isSafeInteger(id))) {
      throw new Error("Invalid transaction selection. Refresh the page and select again.");
    }
    return String(id);
  });
  const uniqueIds = [...new Set(ids)];
  const deletedIds = [];
  // Small requests avoid URL limits for large selections. Report completed
  // batches honestly if a later request fails, then let the UI reload records.
  for (let offset = 0; offset < uniqueIds.length; offset += DELETE_BATCH_SIZE) {
    try {
      const { data, error } = await supabase.from("transactions").delete()
        .eq("user_id", userId).in("id", uniqueIds.slice(offset, offset + DELETE_BATCH_SIZE)).select("id");
      if (error || !Array.isArray(data)) throw new Error("Delete failed");
      deletedIds.push(...data.map((row) => String(row.id)));
    } catch {
      return { deletedIds, count: deletedIds.length, error: "The deletion could not finish. The list has been refreshed; review the remaining transactions before trying again." };
    }
  }
  return { deletedIds, count: deletedIds.length };
}

export async function deleteOwnedTransactionsForMonth(supabase, userId, monthKey) {
  requireAccount(userId);
  if (!validMonthKey(monthKey)) throw new Error("Choose a valid transaction month before deleting.");
  try {
    // One date-scoped DELETE covers the whole selected month, including rows
    // beyond response limits and rows hidden by the current search filters.
    const { count, error } = await supabase.from("transactions").delete({ count: "exact" })
      .eq("user_id", userId)
      .gte("transaction_date", `${monthKey}-01`)
      .lt("transaction_date", `${shiftMonth(monthKey, 1)}-01`);
    if (error || !Number.isInteger(count) || count < 0) throw new Error("Deletion could not be confirmed");
    return { count };
  } catch {
    return { count: null, error: "Could not confirm the deletion for the selected month. The list has been refreshed; check the remaining transactions before trying again." };
  }
}
