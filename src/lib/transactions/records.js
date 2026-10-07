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
    throw new Error("Select between 1 and 10,000 transactions, or use Delete All Transactions.");
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

export async function deleteAllOwnedTransactions(supabase, userId) {
  requireAccount(userId);
  try {
    // One account-scoped DELETE covers every row, without the API's response
    // row limit or a client-provided list of IDs limiting which records it deletes.
    const { count, error } = await supabase.from("transactions").delete({ count: "exact" }).eq("user_id", userId);
    if (error) throw new Error("Delete failed");
    return { count: Number.isInteger(count) ? count : null };
  } catch {
    return { count: null, error: "Could not confirm the deletion. The list has been refreshed; check the remaining transactions before trying again." };
  }
}
